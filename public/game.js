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
        isWaiting: false,
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
        promptlist: [],
        current_prompt: "",
        allocations: new Map(),
        allocation: {},
        your_answer: "",
        answers: new Map(),
        current_vote: {},
        canVote: true,
        votes: new Map(),
        current_result: {},
        scores: new Map(),
        current_score: {},
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
            this.state = message.state;
            this.isLoggedIn = true;
            if (message.role == 'admin') {
                this.isAdmin = true;
            } else if (message.role == 'audience') {
                this.isAudience = true;
            }

        },

        handleUpdate(message) {
            this.round = message.round;
            this.audiencelist = message.audiencelist;
            this.playerlist = message.playerlist;

            this.votes = message.votes;         
            this.allocations = new Map(JSON.parse(message.allocation));             
            this.allocation = this.allocations.get(this.username);
            this.answers = new Map(JSON.parse(message.answers)); 
            this.promptlist = [...this.answers.keys()];
            this.votes = new Map(JSON.parse(message.votes));
            this.scores = new Map(JSON.parse(message.scores));
            this.leaderboard = new Map(JSON.parse(message.leaderboard));
            this.state = message.state;
        },

        handleJoin(message) {
            this.currentView = 'joining'
        },

        handlePrompt(message) {
            this.currentView = 'prompts';
        },

        prompt_create() {
            socket.emit("prompt_create", this.prompt);
        },

        handleAnswer(message) {
            this.currentView = 'answers';
            this.isWaiting = false;
            this.count = 0;
            if (this.allocation.length > 0) {
                this.current_prompt = this.allocation[this.count];
            } 
        },

        answer() {
            let data = {
                prompt: this.current_prompt,
                answer: this.your_answer
            }
            socket.emit("answer", data);
            this.count ++;
            if (this.count >= this.allocation.length) {
                if (!this.isAdmin) {
                    socket.emit("finish");
                }
                this.isWaiting = true;
            } else {
                this.current_prompt = this.allocation[this.count];
            }
        },

        handleVote(message) {
            this.currentView = 'voting';
            this.isWaiting = false;
            this.count = 0;
            this.current_prompt = this.promptlist[this.count];
            this.current_vote = this.answers.get(this.current_prompt);
            console.log(this.current_vote);
            console.log(this.votes);
            if (this.current_vote.p1name == this.username && this.current_vote.p2name == this.username) {
                this.canVote = false;
            } 
            else{
                this.canVote = true;
            }

        },

        vote1() {
            this.vote(this.current_vote.p1name);
        },

        vote2() {
            this.vote(this.current_vote.p1name);
        },

        skipvote() {
            this.count++;
            if (this.count >= this.promptlist.length) {
                if (!this.isAdmin) {
                    socket.emit("finish");
                }
                this.isWaiting = true;
            } else {
                this.current_prompt = this.promptlist[this.count]
                this.current_vote = this.answers.get(this.current_prompt);
                console.log(`${this.current_vote}`);
                if (this.current_vote.p1name == this.username || this.current_vote.p2name == this.username) {
                    this.canVote = false;
                } 
                else{
                    this.canVote = true;
                }
            }
        },

        vote(text) {
            let data = {
                prompt: this.current_prompt,
                username: text
            }
            socket.emit("vote", data);
            this.count++;
            if (this.count >= this.promptlist.length) {
                if (!this.isAdmin) {
                    socket.emit("finish");
                }
                this.isWaiting = true;
            } else {
                this.current_prompt = this.promptlist[this.count]
                this.current_vote = this.answers.get(this.current_prompt);
                console.log(this.current_vote);
                if (this.current_vote.p1name == this.username || this.current_vote.p2name == this.username) {
                    this.canVote = false;
                } 
                else{
                    this.canVote = true;
                }
            }
            
        },

        next() {
            if (this.isAdmin) {
                socket.emit("next");
            }
        },

        start() {
            if (this.isAdmin) {
                socket.emit("start");
            }
        },

        end() {
            if (this.isAdmin) {
                socket.emit("game over");
            }
        },

        finish(){
            socket.emit("finish");
        },

        result(){
            this.count++;
            if (this.count >= this.promptlist.length) {
                if (!this.isAdmin) {
                    socket.emit("finish");
                }
                this.isWaiting = true;
            } else {
                this.current_prompt = this.promptlist[this.count]
                this.current_result = this.votes.get(this.current_prompt);
            }
            
        },

        handleResults(message) {
            this.currentView = 'results';
            this.isWaiting = false;
            this.count = 0;
            this.current_prompt = this.promptlist[this.count]
            this.current_result = this.votes.get(this.current_prompt)
        },

        score(){
            this.count++;
            if (this.count >= this.promptlist.length) {
                if (!this.isAdmin) {
                    socket.emit("finish");
                }
                this.isWaiting = true;
            } else {
                this.current_prompt = this.promptlist[this.count];
                this.current_score = this.scores.get(this.current_prompt);
            } 
        },

        handleScores(message) {
            this.currentView = 'scores';
            console.log(this.scores);
            this.isWaiting = false;
            this.count = 0;
            this.current_prompt = this.promptlist[this.count];
            this.current_score = this.scores.get(this.current_prompt);

        },

        handleEnd(message) {
            this.currentView = 'game over';
            console.log(this.leaderboard);
        }

    }
});


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
     socket.on('prompts', function(message) {
        console.log('proceeding to prompts');
        app.handlePrompt(message);
    });

    //Handle state: answer
    socket.on('answers', function(message) {
        console.log('proceeding to answers');
        app.handleAnswer(message);
    });

    //Handle state: voting
    socket.on('voting', function(message) {
        console.log('proceeding to voting');
        app.handleVote(message);
    });

    //Handle state: results
    socket.on('results', function(message) {
        console.log('proceeding to result');
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
