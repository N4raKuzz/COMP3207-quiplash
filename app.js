'use strict';

//Set up express
const express = require('express');
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
//Store user-client pair who is playing
let socketToPlayer = new Map();
let playerToSocket = new Map();
//Store user-client pair who is an audience
let socketToAudience = new Map();
let audienceToSocket = new Map();
//Store client that unknown player is not login/registed
let socketInLobby = new Map();

let promptAnswer = new Map();
let promptVote = new Map();
let playerScore = new Map();

// State design:
// 1 - Joining: waiting for players
// 2 - Prompts: players and audience suggest prompts (these will be then used as prompts combined with random prompts from the API)
// 3 - Answers: players give answers to prompts 
// 4 - Voting: players and audience vote on answers to each prompt (cycle through all prompts in the round)
// 5 - Results: voting results (show votes and points for this prompt)
// 6 - Scores: total scores (tally up total overall scores)
// 7 - Game Over: end of game (show final scores)
let gameState = 1;
let userState = new Map();

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
        result: False,
        msg: 'Register failed due to server error.'
      };
  }

}


//Handle login request
async function login(info) {
  console.log(`Handling login request: ${info.username}`);

  try {
      const response = await axios.get(endpoint + path_playerLogin + key, {
        params:{
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
        result: False,
        msg: 'Login failed due to server error.'
      };
  }

}

//Handle new prompt
async function createPrompt(data) {
  console.log(`Handle new prompt creating request from: ${data.username}`);

  try {
    const response = await axios.post(endpoint + path_promptCreate, {
      text: data.text,
      username: data.username
    });

    if (response.data.result == true){
      console.log('Prompt created Success with Response:', response.data);
      return response.data;
    }
    else{
      onsole.log('Prompt created Failed with Response:', response.data);
      return response.data;
    }
      
  } catch (error) {
      console.error('Server Error during Prompt Create:', error);
      return {
        result: False,
        msg: 'Creating prompt failed due to server error.'
      };
  }

}

//Upodate score and games played of player
async function updatePlayer(info){
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
        result: False,
        msg: 'Update player failed due to server error.'
      };
  }
}

async function getPrompt(info){
  console.log(`Getting prompts of player ${info.username}`)

  try{
    const response = await axios.get(endpoint + path_utilsGet + key, {
      params:{
        username:info.username,
        language:info.lancode
      }
    });

    if (response.data.result == true){
      console.log('Get player prompts Success with Response'. response.data.msg);
      return response.data;
    }
    else{
      console.log('Get player prompts Failed with Response', response.data.msg);
      return response.data;
    }

  } catch(error){
    console.error('Server Error during Get player prompts:', error);
    return { 
      result: False,
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
      result: False,
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
        result: False,
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
    role = 'player';
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
  
  //Log user in if register successful
  if (num_player >= 8){
    //Add to audiences if players num is full
    socketToAudience.set(socket, username);
    audienceToSocket.set(username, socket);
    data = {
      state: gameState,
      role: 'audience',
      lancode: 'en'
    }
    userState.set(username, data);
    num_player += 1;
  }
  else{
    //Add to players
    socketToPlayer.set(socket, username);
    playerToSocket.set(username, socket);
    data = {
      state: gameState,
      role: 'player',
      lancode: 'en'
    }
    userState.set(username, data);
    num_player += 1;
    //socket.emit('login')
  }
}

async function updatePlayer(username){
  data = userState.get(username);
  data.state += 1;
  userState.set(username, data);
}

function checkState(){
  for (let username of userState.keys()){
    if (userState.get(username).state != gameState){
      return false;
    }
    continue;
  }

  gameState += 1;
  return true
}

function updateAll(staeNum){
  if (checkState()){
    for (let username of playerToSocket.keys()){
      let socket = playerToSocket.get(username);
      switch(gameState){
        case 1:
          // Joining
          socket.emit('joining');
        case 2:
          // Prompts
          socket.emit('prompts');
        case 3:
          // Answers
          let prompt_allocation = allocatePrompts();
          socket.emit('answers', prompt_allocation.get(username));
        case 4:
          // Voting
          socket.emit('voting', promptAnswer.get(prompt));
        case 5:
          // Results
          socket.emit('results', promptAnswer.get(
      }
    }
  }
  
}

function startGame(){
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
  }
  else if (socketToPlayer.has(socket)){
    username = socketToPlayer.get(socket);
    socketToPlayer.delete(socket);
    playerToSocket.delete(username);

    result = true;
    msg = 'Removed from player'
  }

  num_player -= 1
  return {
    result: result,
    msg: msg,
    username: username
  };
}

function countVotes() {
  for (let prompt of promptVote.keys()) {
    
  }
}

function allocatePrompts() {
  console.log('Allocating prompts for players');

  let playerlist = playerToSocket.keys();
  let userlist = userState.keys();
  let promptlist = [];
  for (let user of userlist){
    promtplist = promptlist.push(getPrompt({
      username: user,
      lancode: 'en'
    }))
  }

  let userPromptMap = new Map();
  let lenUser = playerlist.length;
  let shuffledPrompts = [...promptlist];
  
  //Function to shuffle the prompts
  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }
  shuffleArray(shuffledPrompts);

  if (lenUser % 2 == 0) {
      //Each player gets 1 prompt
      for (let i = 0; i < lenUser/2; i++) {
        let prompts = [shuffledPrompts[i]]
        userPromptMap.set(playerlist[2*i], prompts);
        userPromptMap.set(playerlist[2*i+1], prompts);
      }
  } else {
      //Store the first prompt
    	firstprompt = shuffledPrompts[0];
      for (let i = 0; i < lenUser; i++) {
        //Each player gets 2 prompts
        let prompts
        if (i == lenUser -1){
          //Give the first prompt to the last player
          promtps = [shuffledPrompts[i], firstprompt]
        }
        else {
          promtps = [shuffledPrompts[i], shuffledPrompts[i+1]];
        }
        userPromptMap.set(playerlist[i],prompts);
      }
  }

  return userPromptMap;
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

  //Handle on chat message received
  socket.on('chat', message => {
    handleChat(message);
  });

  //If user click register
  socket.on('register', info => {
    res = register(info).then(res => {
      if (res.result == true){
        logPlayerIn(socket, info.username)
      }
      else{
        socket.emit('error', res.msg)
      }
    });
    
  });

  //If user click login
  socket.on('login', info => {
    login(info).then(res => {
      if (res.result == true){
        logPlayerIn(socket, info.username)
      }
      else {
        socket.emit('error', res.msg)
      }

    });
    
  });

  socket.on('prompt_create', text => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true){
        res = createPrompt({
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

  socket.on('answer', data => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true && login_res.role == 'player'){
        let username = login_res.username;
        let prompt = data.prompt;
        let answer = data.answer;

        // Store the answer to the prompt
        if (promptAnswer.has(prompt)) {
          let answers = promptAnswer.get(prompt);
          answers.push({
            username: username,
            answer: answer
          });
          promptAnswer.set(prompt, answers);
        }
        else{
          promptAnswer.set(prompt, [{
            username: username,
            answer: answer
          }]);
        }
      }
      else {
        socket.emit('error','Not Authenticated to Answer Prompts')
      }
      
    });

  });

  socket.on('vote', data => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true){
        let prompt = data.prompt;
        let vote = data.username;

        // Store the votes to the answer
        if (promptVote.has(prompt)) {
          let votes = promptVote.get(prompt);
          answers.push({
            vote: vote
          });
          promptVote.set(prompt, votes);
        }
        else{
          promptVote.set(prompt, [{
            vote: vote
          }]);
        }
      }
      else {
        socket.emit('error','Not Authenticated to Answer Prompts')
      }
      
    });

  });

  socket.on('prompt_delete', info => {
    checkLoggedIn(socket).then(login_res => {
      if (login_res.result == true){
        res = deletePrompt({
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

  //If user disconnect
  socket.on('disconnect', () => {
    res = disconnect(socket)
    console.log(`Dropped connection to ${res.username}`);
    socket.disconnect();
  });
  
});

//Start server
if (module === require.main) {
  startServer();
}

module.exports = server;
