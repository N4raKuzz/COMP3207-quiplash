'use strict';

//Set up express
const express = require('express');
const axios = require("axios");
const app = express();

//Setup socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server);

const endpoint = "https://quiplash-zz22u21.azurewebsites.net/api/"
const path_promptCreate = "prompt/create"
const path_promptDelete = "prompr/delete"
const path_playerLogin = "player/login"
const path_playerRegister = "player/register"
const path_playerUpdate = "player/update"
const path_utilsLearderboard = "utils/leaderboard"
const path_utilsGet = "utils/get"
const key = "?code=bzv6_olxVECirEcx8uy4bS9DMwOHom2HMZ6lhs2rroClAzFul_wSng=="

let num_player = 0;
let admin = '';
let playerlist = [];
//Store user-client pair who is playing
let socketToPlayer = new Map();
let playerToSocket = new Map();
//Store user-client pair who is an audience
let socketToAudience = new Map();
let audienceToSocket = new Map();
//Store client that unknown player is not login/registed
let socketInLobby = new Map();

let promptAllocation = new Map();
let promptAnswer = new Map();
let promptVote = new Map();
let promptResult = new Map();
let promptScore = new Map();

// State design:
// 1 - Joining: waiting for players
// 2 - Prompts: players and audience suggest prompts (these will be then used as prompts combined with random prompts from the API)
// 3 - Answers: players give answers to prompts 
// 4 - Voting: players and audience vote on answers to each prompt (cycle through all prompts in the round)
// 5 - Results: voting results (show votes and points for this prompt)
// 6 - Scores: total scores (tally up total overall scores)
// 7 - Game Over: end of game (show final scores)
let gameState = 1;
let gameRound = 1;
let userState = new Map();
let leaderboard = new Map();

//Setup static page handling
app.set('view engine', 'ejs');
app.use('/static', express.static('public'));

//Handle client interface on /
app.get('/', (req, res) => {
  res.render('client');
});
//Handle display interface on /display
app.get('/display', (req, res) => {
  res.render('display');
});

// URL of the backend API
const BACKEND_ENDPOINT = process.env.BACKEND || 'http://localhost:8181';

//Start the server
function startServer() {
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

//Chat message
function handleChat(message) {
    console.log('Handling chat: ' + message); 
    io.emit('chat',message);
}

//-----------------------------API Calls from socket--------------------------------------

//Handle register request
async function register(info) {
  console.log(`Handling register request: ${info.username}`);

  try {
      const response = await axios.post(endpoint + path_playerRegister + key, {
          username: info.username,
          password: info.password
      });

      if (response.data.result == true){
        console.log('Register Success with Response:', response.data);
        return response.data;
      }
      else{
        console.log('Register Failed with Response:', response.data);
        return response.data;
      }

  } catch (error) {
      console.error('Server Error during Register:', error);
      return {
        result: false,
        msg: 'Register failed due to server error.'
      };
  }

}


//Handle login request
async function login(info) {
  console.log(`Handling login request: ${info.username}`);

  try {
      const response = await axios.get(endpoint + path_playerLogin + key, {
        data:{
          username: info.username,
          password: info.password
        }
      });

      if (response.data.result == true){
        console.log('Login Success with Response:', response.data.msg);
        return response.data;
      }
      else{
        console.log('Login Failed with Response:', response.data.msg);
        return response.data;
      }
      
  } catch (error) {
      console.error('Server Error during Login:', error);
      return {
        result: false,
        msg: 'Login failed due to server error.'
      };
  }

}

//Handle new prompt
async function createPrompt(data) {
  console.log(`Handle new prompt creating request from: ${data.username}`);

  try {
    const response = await axios.post(endpoint + path_promptCreate + key, {
      text: data.text,
      username: data.username
    });

    if (response.data.result == true){
      console.log('Prompt created Success with Response:', response.data);
      return response.data;
    }
    else{
      console.log('Prompt created Failed with Response:', response.data);
      return response.data;
    }
      
  } catch (error) {
      console.error('Server Error during Prompt Create:', error);
      return {
        result: false,
        msg: 'Creating prompt failed due to server error.'
      };
  }

}

//Upodate score and games played of player
async function updatePlayerScore(info){
  console.log(`Updating player: ${info.username}`);

  try {
      const response = await axios.put(endpoint + path_playerUpdate + key, {
        username: info.username,
        add_to_games_played: info.addgames,
        add_to_score: info.addscore
      });

      if (response.data.result == true){
        console.log('Update player Success with Response:', response.data.msg);
        return response.data;
      }
      else{
        console.log('Update player Failed with Response:', response.data.msg);
        return response.data;
      }
      
  } catch (error) {
      console.error('Server Error during Update player:', error);
      return {
        result: false,
        msg: 'Update player failed due to server error.'
      };
  }
}

async function getPrompt(players){

  try{
    const response = await axios.get(endpoint + path_utilsGet + key, {
      data:{
        players:players,
        language:'en'
      }
    });
    return response.data;

  } catch(error){
    console.error('Server Error during Get player prompts:', error);
    return { 
      result: false,
      msg: 'Get player prompts failed due to server error'
    };
  }
}

async function getLeaderboard(num){
  console.log('Getting leaderboard')

  try{
    const response = await axios.post(endpoint + path_utilsLearderboard + key, {
      params:{
        top: num
      }
    });

    if (response.data.result == true){
      console.log('Get leaderboard Success with Response'. response.data.msg);
      return response.data;
    }
    else{
      console.log('Get leaderboard Failed with Response', response.data.msg);
      return response.data;
    }

  } catch(error){
    console.error('Server Error during Get leaderboard:', error);
    return { 
      result: false,
      msg: 'Get leaderboard failed due to server error'
    };
  }
}


//api写了他妈不用你让我写干什么
async function daletePrompt(data) {
  console.log(`Handle prompt deleting request from: ${data.username}`);

  try {
    let response
    if ("player" in data){
      response = await axios.post(endpoint + path_promptDelete + key, {
        player: data.text,
        username: data.username
      });
    }
    else{
      response = await axios.post(endpoint + path_promptDelete + key, {
        word: data.text,
        username: data.username
      });
    }
      
    if (response.data.result == true){
      console.log('Deleting prompt Succeed with Response:', response.data);
      return response.data;
    }
    else{
      onsole.log('Deleting prompt Failed with Response:', response.data);
      return response.data;
    }
      
  } catch (error) {
      console.error('Server Error during Prompt Create:', error);
      return {
        result: false,
        msg: 'Deleting prompt failed due to server error.'
      };
  }

}

//---------------------------------Server Utils-------------------------------------

async function checkLoggedIn(socket){
  let result = false;
  let msg = 'Related socket not logged in';
  let username = 'unknown';
  let role = 'unknown';

  if (socketToAudience.has(socket)){
    result = true;
    msg = 'Socket logged in as audience';
    username = socketToAudience.get(socket);
    role = 'audience';
  }
  else if (socketToPlayer.has(socket)){
    result = true;
    msg = 'Socket logged in as player';
    username = socketToPlayer.get(socket);

    if (socketToPlayer.get(socket) == admin){
      role = 'admin';
    } else {
      role = 'player';
    }
    
  }

  return {
    result: result,
    msg: msg,
    username: username,
    role: role
  };
}

async function logPlayerIn(socket, username){
  //Remove user from lobby
  socketInLobby.delete(socket);
  playerlist.push(username);
  //Log user in 
  if (num_player == 0){
    //Set first player as admin
    socketToPlayer.set(socket, username);
    playerToSocket.set(username, socket);
    let data = {
      state: gameState,
      role: 'admin',
    }
    admin = username;
    console.log(`Set ${username} as admin`);
    userState.set(username, gameState);
    num_player += 1;
    socket.emit('login', data);

  } else if (num_player >= 8){
    //Add to audiences if players num is full
    socketToAudience.set(socket, username);
    audienceToSocket.set(username, socket);
    let data = {
      state: gameState,
      role: 'audience',
    }
    userState.set(username, gameState);
    num_player += 1;
    socket.emit('login', data);

  } else{
    //Add to players
    socketToPlayer.set(socket, username);
    playerToSocket.set(username, socket);
    let data = {
      state: gameState,
      role: 'player',
    }
    userState.set(username, gameState);
    num_player += 1;
    socket.emit('login', data);

    for (let player of playerToSocket.keys()) {
      updatePlayer(player);
    }
    for (let audience of audienceToSocket.keys()) {
      updatePlayer(audience);
    }
    
  }

  updatePlayer(username);
  switch(gameState){
    case 1:
      // Joining
      socket.emit('joining');
      break;
    case 2:
      // Prompts
      socket.emit('prompts');
      break;
    case 3:
      // Answers
      socket.emit('answers');
      break;
    case 4:
      // Voting
      socket.emit('voting');
      break;
    case 5:
      // Results
      socket.emit('results');
      break;
    case 6:
      // Scores
      socket.emit('scores');
      break;
    case 7:
      // Scores
      socket.emit('game over');
      break;
          
  }

}

async function updatePlayer(username){
  let socket;

  let data = {
    allocation: JSON.stringify(Array.from(promptAllocation)),
    votes: JSON.stringify(Array.from(promptResult)),
    answers: JSON.stringify(Array.from(promptAnswer)),
    scores: JSON.stringify(Array.from(promptScore)),
    round: gameRound,
    leaderboard: JSON.stringify(Array.from(leaderboard)),
    playerlist: [...playerToSocket.keys()],
    audiencelist: [...audienceToSocket.keys()],
    state: gameState
  };

  if (audienceToSocket.has(username)){
    socket = audienceToSocket.get(username);
    socket.emit('update', data);
  }
  else if (playerToSocket.has(username)){
    socket = playerToSocket.get(username);
    socket.emit('update', data);
  }
  
}

async function checkState(){
  console.log('checking all client states');
  for (let username of userState.keys()){
    if (userState.get(username) < gameState){
      console.log(`User ${username} not up to date`);
      return false;
    }
    userState.set(username,gameState);
    continue;
  }

  gameState += 1;
  if (gameState == 7 || gameState == 3){
    gameState = 3;
    await allocatePrompts().then();
  }

  if (gameState == 5){
    await countVotes().then();
  }

  if (gameState == 6){
    await countScores().then();
  }

  return true
}

function updateAll(){
  console.log("Update all client to next state");

  checkState().then(res =>{
    if (res){
      for (let username of userState.keys()){
        let socket
        if (audienceToSocket.has(username)){
          socket = audienceToSocket.get(username);
        }
        else if (playerToSocket.has(username)){
          socket = playerToSocket.get(username);
        }
        updatePlayer(username);
  
        switch(gameState){
          case 3:
            // Answers
            console.log("Going to answers")
            socket.emit('answers');
            break;
          case 4:
            // Voting
            console.log("Going to voting")
            socket.emit('voting');
            break;
          case 5:
            // Results
            console.log("Going to results")
            socket.emit('results');
            break;
          case 6:
            // Scores
            console.log("Going to scores")
            socket.emit('scores');
            break;
            
        }
      }
    }
  });
  
}

function endAll(){
  // Game over
  console.log("Game over");
  countLeaderboard().then();

  for (let username of playerToSocket.keys()){
    let socket = playerToSocket.get(username);
    updatePlayer(username);
    socket.emit('game over');
  }
}

function startAll(){
  // Start game
  gameState = 2;
  gameRound += 1;
  for (let username of playerToSocket.keys()){
    let socket = playerToSocket.get(username);
    socket.emit('prompts');
  }
}

async function disconnect(socket){
  let result = false;
  let msg = `Failed to remove socket: ${socket}`;
  let username = 'default';

  if (socketInLobby.has(socket)){
    socketInLobby.delete(socket);

    result = true;
    msg = 'Removed from lobby'
    username = 'unknown';
  }
  else if (socketToAudience.has(socket)){
    username = socketToAudience.get(socket);
    socketToAudience.delete(socket);
    audienceToSocket.delete(username);

    result = true;
    msg = 'Removed from audience'
    num_player -= 1
  }
  else if (socketToPlayer.has(socket)){
    username = socketToPlayer.get(socket);
    socketToPlayer.delete(socket);
    playerToSocket.delete(username);

    result = true;
    msg = 'Removed from player'
    num_player -= 1
  }

  return {
    result: result,
    msg: msg,
    username: username
  };
}

// Count the votes for each prompt answers
async function countVotes() {

  for (let prompt of promptVote.keys()) {
    let votes = promptVote.get(prompt);
    let voteCounts = {
      p1name: "",
      p1count: 0,
      p2name: "",
      p2count: 0
    };

    for (let vote of votes) {
      if(voteCounts.p1name == vote){
        voteCounts.p1count++;
      } else if(voteCounts.p2name == vote){
        voteCounts.p2count++;
      } else if (voteCounts.p1name == ""){
        voteCounts.p1name = vote;
        voteCounts.p1count = 1;
      } else {
        voteCounts.p2name = vote;
        voteCounts.p2count = 1;
      }
    }

    promptResult.set(prompt, voteCounts);
  }
  console.log(promptResult);
}

// Count the score for each player of one prompt
async function countScores() {
  for (let prompt of promptResult.keys()) {
    let resultOfprompt = promptResult.get(prompt);
    let scoreCounts = {
      p1name: resultOfprompt.p1name,
      p1score: resultOfprompt.p1count * gameRound * 100,
      p2name: resultOfprompt.p2name,
      p2score: resultOfprompt.p2count * gameRound * 100
    };

    promptScore.set(prompt, scoreCounts);
  }
  console.log(promptScore);
}

async function countLeaderboard(){
  for (let player of playerToSocket.keys()) {
    let finalScore = 0;
    for (let prompt of promptScore.keys()) {
      if (promptScore.get(prompt).p1name == player){
          finalScore = finalScore + promptScore.get(prompt).p1score;
      } else if (promptScore.get(prompt).p2name == player) {
          finalScore = finalScore + promptScore.get(prompt).p2score;
      }
    }
    leaderboard.set(player, finalScore);
  }
  console.log(leaderboard);
}

async function allocatePrompts() {
  console.log('Allocating prompts for players');

  let playerlist = [...playerToSocket.keys()];
  let userlist = [...userState.keys()];
  let promptlist = [];

  console.log(`Getting prompts from users: ${userlist}`);
  await getPrompt(userlist).then(res => {
    for (let i = 0; i < res.length; i++) {
      promptlist.push(res[i].text);
    }

    console.log(`Prompts: ${promptlist}`);
    promptAllocation.clear();
    let lenUser = playerlist.length;

    if (lenUser % 2 == 0) {
      //Each player gets 1 prompt
      for (let i = 0; i < lenUser / 2; i++) {
        let prompt = [promptlist[i]];
        promptAllocation.set(playerlist[2*i], prompt);
        promptAllocation.set(playerlist[2*i+1], prompt);
    }
    } else {
      for (let i = 0; i < lenUser; i++) {
        let prompts;
        if (i == lenUser - 1) {
            prompts = [promptlist[i], promptlist[0]];
        } else {
            prompts = [promptlist[i], promptlist[i+1]];
        }
        promptAllocation.set(playerlist[i], prompts);
      } 
    }

  });
}


//Move user from audience to player
async function addPlayerFromAudience(username){
  let result = false;
  let msg = 'user not in audiences'
  
  if (audienceToSocket.has(username)){
    socket = audienceToSocket.get(username);
    socketToAudience.delete(socket);
    audienceToSocket.delete(username);
    socketToPlayer.set(socket,username);
    playerToSocket.set(username,socket);

    result = true;
    msg = 'OK'
  }

  return {
    result: result,
    msg: msg
  }
}

//Handle new connection
io.on('connection', socket => { 
  console.log('New connection');
  socketInLobby.set(socket,'unknown')
  socket.emit('connection'); 

  //Handle chat message received
  socket.on('chat', message => {
    handleChat(message);
  });

  // User register
  socket.on('register', info => {
    register(info).then(res => {
      if (res.result == true){
        logPlayerIn(socket, info.username).then();
      }
      else{
        socket.emit('error', res.msg)
      }
    });
    
  });

  // User login
  socket.on('login', info => {
    login(info).then(res => {
      if (res.result == true){
        logPlayerIn(socket, info.username).then();
      }
      else {
        socket.emit('error', res.msg)
      }

    });
    
  });

  // User creates new prompt
  socket.on('prompt_create', text => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true){
        createPrompt({
          text: text,
          username: login_res.username
        }).then(res =>{
          if (res.result == true){
            socket.emit('promp_create', res.msg)
          }
          else{
            socket.emit('error', res.msg)
          }
        });
      }
      else {
        socket.emit('error','Not Authenticated to Create Prompts')
      }
      
    });
    
  });

  // Client finish current session
  socket.on('finish', () => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true){
        let username = login_res.username;
        console.log(`User ${username} Finish Current State`);
        userState.set(username, userState.get(username) + 1);
      }
      else {
        socket.emit('error','Not Authenticated to report updates')
      }
      
    });
    
  });

  // Player answers prompt
  socket.on('answer', data => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true && (login_res.role == 'player' || login_res.role == 'admin')){
        let username = login_res.username;
        let prompt = data.prompt;
        let answer = data.answer;
        console.log(`${username} answer to prompt: ${prompt}`);
        // Store the answer to the prompt
        if (promptAnswer.has(prompt)) {
          let answer1 = promptAnswer.get(prompt);
          promptAnswer.set(prompt, {
            p1name: answer1.p1name,
            p1answer: answer1.p1answer,
            p2name: username,
            p2answer: answer
          });
        }
        else{
          promptAnswer.set(prompt, {
            p1name: username,
            p1answer: answer
          });
        }
        console.log(promptAnswer);
        console.log(JSON.stringify(Array.from(promptAnswer)));
        console.log(JSON.parse(JSON.stringify(Array.from(promptAnswer))));
      }
      else {
        socket.emit('error','Not Authenticated to Answer Prompts')
      }
      
    });

  });

  // Player vote for answers
  socket.on('vote', data => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true){
        let prompt = data.prompt;
        let vote = data.username;

        // Store the votes to the answer
        if (promptVote.has(prompt)) {
          let votes = promptVote.get(prompt);
          votes.push(vote);
          promptVote.set(prompt, votes);
        }
        else{
          promptVote.set(prompt, [vote]);
        }
      }
      else {
        socket.emit('error','Not Authenticated to Answer Prompts')
      }
      
    });

  });

  // Admin calls for next state
  socket.on('next', () => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true && login_res.role == 'admin') {
        let username = login_res.username;
        userState.set(username, gameState);
        updateAll();
      }
      else {
        socket.emit('error','Not Authenticated to Proceed')
      }
      
    });

  });  

  // Admin ends game
  socket.on('game over', () => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true && login_res.role == 'admin') {
        endAll();
      }
      else {
        socket.emit('error','Not Authenticated to End Game')
      }
      
    });

  });

  // Admin Starts game
  socket.on('start', () => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true && login_res.role == 'admin') {
        console.log('Game started');
        startAll();
      }
      else {
        socket.emit('error','Not Authenticated to Start Game')
      }
      
    });

  });

  // Admin delete prompts
  socket.on('prompt_delete', info => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true){
        deletePrompt({
          text: text,
          username: login_res.username
        }).then(res =>{
          if (res.result == true){
            socket.emit('promp_delete', res.msg)
          }
          else{
            socket.emit('error', res.msg)
          }
        });
      }
      else {
        socket.emit('error','Not Authenticated to Create Prompts')
      }

    });

  });

  // Detect User disconnect
  socket.on('disconnect', () => {
    let res = disconnect(socket)
    console.log(`Dropped connection to ${res.username}`);
    socket.disconnect();
  });
  
});

//Start server
if (module === require.main) {
  startServer();
}

module.exports = server;
