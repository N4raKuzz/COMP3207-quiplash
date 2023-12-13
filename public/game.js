var socket = null;
var currentView = null;

//Prepare game
var app = new Vue({
    el: '#game',
    data: {
        currentView: currentView,
        state: 0,

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

        // Prompt and round info
        prompt: "",
        current_prompt: "",
        allocation: {},
        your_answer: "",
        answers: {},
        current_vote: {},
        canVote: true,
        votes: {},
        leaderboard: [],
        count: 0
        
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

        register() {
            data = {
                username: this.username,
                password: this.password
            }
            socket.emit("register", data);
        },

        login() {
            data = {
                username: this.username,
                password: this.password
            }
            socket.emit("login", data);
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

            this.votes = message.votes;
            this.allocation = message.allocation.get(username);
            this.promptlist = message.allocation.keys();
            this.answers = message.answers;
            this.state = message.state;
        },

        handleJoin(message) {
            this.currentView = message.state;
        },

        handlePrompt(message) {
            this.currentView = message.state;
        },

        prompt_create() {
            socket.emit("prompt_create", this.prompt);
        },

        handleAnswer(message) {
            this.currentView = message.state;
            this.count = 0;
            if (allocation.length > 0) {
                current_prompt = allocation[this.count];
            } 
        },

        answer() {
            data = {
                prompt: this.current_prompt,
                answer: this.your_answer
            }
            socket.emit("answer", data);
            count ++;
            if (count >= this.allocation.length) {
                socket.emit("finish");
                currentView = "wait";
            } else {
                this.current_prompt = this.allocation[count];
            }
        },

        handleVote(message) {
            this.currentView = message.state;
            this.count = 0;
            this.current_prompt = this.promptlist[this.count]
            this.current_vote = {
                prompt: this.current_prompt,
                p1: this.answers.get(this.current_prompt)[0],
                p2: this.answers.get(this.current_prompt)[1]
            };
            if (this.current_vote.p1.username == this.user.username && this.current_vote.p2.username == this.user.username) {
                this.canVote = false;
            } 
            else{
                this.canVote = true;
            }

        },

        vote1() {
            this.vote(this.current_vote.p1.username);
        },

        vote2() {
            this.vote(this.current_vote.p1.username);
        },

        vote(text) {
            data = {
                prompt: this.current_prompt,
                username: text
            }
            socket.emit("vote", data);
            count++;
            if (count >= this.promptlist.length) {
                socket.emit("finish");
                currentView = "wait";
            } else {
                this.current_prompt = this.promptlist[this.count]
                this.current_vote = this.answers.get(this.current_prompt);
            }
            
        },

        finish(){
            socket.emit("finish");
        },

        handleResults(message) {
            this.currentView = message.state;
        },

        handleScores(message) {
            this.currentView = message.state;
        }

    }
});

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
    socket.on('connection', function() {
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
