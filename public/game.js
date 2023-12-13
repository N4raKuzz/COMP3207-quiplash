var socket = null;
var currentView = 'lobby';

//Prepare game
var app = new Vue({
    el: '#game',
    data: {
        currentView: currentView,

        // Client data
        playerlist: [],
        audiencelist: [],
        prompts:[],
        connected: false,

        // User Info
        isLoggedIn: false,
        isAdmin: false,
        isAudience: false,
        admin: "",
        username: "",
        password: "",
        notEnoughPlayers: true,

        // Chat
        messages: [],
        chatmessage: "",
        
        // Error Info
        error: false,
        msg: "",

        // Current prompt and round info
        prompt: "",
        answer: {},
        vote: {},
        allocation: {},
        round: 0
        
    },

    mounted: function() {
        connect(); 
    },

    methods: {
        handleChat(message) {
            if(this.messages.length + 1 > 10) {
                this.messages.pop();
            }
            this.messages.unshift(message);
        },

        chat() {
            socket.emit('chat',this.chatmessage);
            this.chatmessage = '';
        },

        handleLogin(message) {
            this.currentView = message.state;
            this.isLoggedIn = true;
            if (message.role == 'admin') {
                this.isAdmin = true;
            } else if (message.role == 'audience') {
                this.isAudience = true;
            }

            this.username = message.username;
        },

        handleUpdate(message) {
            this.round = message.round;
            this.audiencelist = message.audiencelist;
            this.playerlist = message.playerlist;

            this.prompt = message.prompt;
            this.vote = message.votes.get(prompt);
            this.allocation = message.allocation.get(prompt);
            this.answer = message.answers.get(prompt);
        },

        handleJoin(message) {
            this.currentView = message.state;
        },

        handlePrompt(message) {
            this.currentView = message.state;
        },

        handleAnswer(message) {
            this.currentView = message.state;
        },

        handleVote(message) {
            this.currentView = message.state;
        },

        handleResults(message) {
            this.currentView = message.state;
        },

        handleScores(message) {
            this.currentView = message.state;
        }

    }
});

// User functions
function register(data) {
    socket.emit("register", data);
}

function login(data) {
    socket.emit("login", data);
}
  
function vote(data) {
    socket.emit("vote", data);
}

function answer(data) {
    socket.emit("answer", data);
}

function prompt_create(data) {
    socket.emit("prompt_create", data);
}

function finish(data) {
    socket.emit("finish", data);
}

// Admin functions
function next() {
    socket.emit("next");
}

function start() {
    socket.emit("start");
}

function end() {
    socket.emit("game over");
}


function connect() {
    //Prepare web socket
    socket = io();

    //Connect
    socket.on('connect', function() {
        //Set connected state to true
        app.connected = true;
    });

    //Handle connection error
    socket.on('error', function(message) {
        alert('Error: ' + message);
    });

    //Handle disconnection
    socket.on('disconnect', function() {
        alert('Disconnected');
        app.connected = false;
    });

    //Handle incoming chat message
    socket.on('chat', function(message) {
        app.handleChat(message);
    });

    //Handle state: joining
    socket.on('joining', function(message) {
        app.handleJoin(message);
    });

     //Handle state: prompt
     socket.on('chat', function(message) {
        app.handlePrompt(message);
    });

    //Handle state: voting
    socket.on('answers', function(message) {
        app.handleAnswer(message);
    });

    //Handle state: results
    socket.on('results', function(message) {
        app.handleResults(message);
    });

    //Handle state: scores
    socket.on('scores', function(message) {
        app.handleScores(message);
    });

    //Handle state: scores
    socket.on('game over', function(message) {
        app.handleEnd(message);
    });

    //Handle Login info
    socket.on('login', function(message) {
        app.handleLogin(message);
    });  

    //Handle Update data
    socket.on('update', function(message) {
        app.handleUpdate(message);
    }); 

}
