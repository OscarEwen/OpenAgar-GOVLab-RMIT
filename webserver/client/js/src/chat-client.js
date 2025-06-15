import * as config from './config.js';

class ChatClient {
    constructor(params) {
        this.canvas = config.canvas;
        this.socket = config.socket;
        this.mobile = config.mobile;
        this.player = config.player;
        var self = this;
        this.commands = {};
        var input = document.getElementById('chatInput');
        input.addEventListener('keyup', this.sendChat.bind(this));
        input.addEventListener('keyup', function(key) {
            input = document.getElementById('chatInput');
            key = key.key; //.which || key.keyCode;
            if (key === config.KEY_ESC) {
                input.value = '';
                self.canvas.cv.focus();
            }
        });
        config.chatClient = this;
    }

    // TODO: Break out many of these GameControls into separate classes.

    registerFunctions() {
    var self = this;
    this.adminPassword = 'Openagar';
    this.registerCommand('ping', 'Check your latency.', () => self.checkLatency());
    this.registerCommand('dark', 'Toggle dark mode.', () => self.toggleDarkMode());
    this.registerCommand('border', 'Toggle visibility of border.', () => self.toggleBorder());
    this.registerCommand('mass', 'Toggle visibility of mass.', () => self.toggleMass());
    this.registerCommand('continuity', 'Toggle continuity.', () => self.toggleContinuity());
    this.registerCommand('help', 'Information about the chat commands.', () => self.printHelp());

// Admin login command
this.registerCommand('admin', 'Login as admin.', (args) => {
    if (args[0] === self.adminPassword) {
        self.isAdmin = true;
        self.addSystemLine('Admin console activated.');

        // Show dropdown after login
        const dropdown = document.getElementById('debugCommandDropdown');
        if (dropdown) dropdown.style.display = 'inline';

        // Show help automatically
        const lines = [
            'Admin Debug Commands:',
            '-eval player size Shows your mass',
            '-eval player position Shows your X/Y',
            '-eval players count Counts active players',
            '-eval players position Lists all player positions',
            '-eval players size Lists all player sizes',
            '-eval player Dumps full player object'
        ];
        lines.forEach(line => self.addSystemLine(line));

    } else {
        self.addSystemLine('Incorrect password.');
    }
});



// Help command (optional if users want to recheck commands later)
this.registerCommand('help', 'Show all debug/admin commands.', () => {
    
    const lines = [
        'Admin Debug Commands:',
        '-eval player size',
        '-eval player position',
        '-eval players count',
        '-eval players position',
        '-eval players size',
        '-eval player'
    ];
    lines.forEach(line => self.addSystemLine(line));
});

this.registerCommand('eval', 'Evaluate debug commands (admin only).', (args) => {
    if (!self.isAdmin) {
        self.addSystemLine(' You must be logged in as admin to use eval.');
        return;
    }

    const input = args.join(' ');
    const debugMap = {
    'player size': 'player.massTotal',
    'player position': '({ x: player.x, y: player.y })',
    'players count': 'players.filter(p => p && p.cells?.length > 0).length',
    'players position': 'players.filter(p => p && p.cells?.length > 0).map(p => ({ name: p.name, x: p.x, y: p.y }))',
    'players size': 'players.filter(p => p && p.cells?.length > 0).map(p => ({ name: p.name, mass: p.massTotal }))',
    'player': 'player'
};

    const code = debugMap[input] || input;

    try {
        const globals = {
            player: config.player,
            players: window.players || [],
            bots: window.bots || [],
            socket: self.socket,
            config: config
        };
        const fn = new Function('globals', `with (globals) { return ${code}; }`);
        const result = fn(globals);
        self.addSystemLine('Result: ' + JSON.stringify(result));
    } catch (err) {
        self.addSystemLine('Error: ' + err.message);
    }
});




document.getElementById('debugCommandDropdown').addEventListener('change', function () {
    const cmd = this.value;
    if (cmd) {
        document.getElementById('chatInput').value = `-eval ${cmd}`;
        this.selectedIndex = 0;
        document.getElementById('chatInput').focus();
    }
});

    config.chatClient = this;
    this.registerFunctions();
}


    // Chat box implementation for the users.
    addChatLine(name, message, me) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        // Colours the chat input correctly.
        newline.className = (me) ? 'me' : 'friend';
        newline.innerHTML = '<b>' + ((name.length < 1) ? 'An unnamed cell' : name) + '</b>: ' + message;

        this.appendMessage(newline);
    }

    // Chat box implementation for the system.
    addSystemLine(message) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        // Colours the chat input correctly.
        newline.className = 'system';
        newline.innerHTML = message;

        // Append messages to the logs.
        this.appendMessage(newline);
    }

    // Places the message DOM node into the chat box.
    appendMessage(node) {
        if (this.mobile) {
            return;
        }
        var chatList = document.getElementById('chatList');
        if (chatList.childNodes.length > 10) {
            chatList.removeChild(chatList.childNodes[0]);
        }
        chatList.appendChild(node);
    }

    // Sends a message or executes a command on the click of enter.
    sendChat(key) {
        var commands = this.commands,
            input = document.getElementById('chatInput');

        key = key.key; //.which || key.keyCode;

        if (key === config.KEY_ENTER) {
            var text = input.value.replace(/(<([^>]+)>)/ig,'');
            if (text !== '') {

                // Chat command.
                if (text.indexOf('-') === 0) {
                    var args = text.substring(1).split(' ');
                    if (commands[args[0]]) {
                        commands[args[0]].callback(args.slice(1));
                    } else {
                        this.addSystemLine('Unrecognized Command: ' + text + ', type -help for more info.');
                    }

                // Allows for regular messages to be sent to the server.
                } else {
                    this.socket.emit('playerChat', { sender: this.player.name, message: text });
                    this.addChatLine(this.player.name, text, true);
                }

                // Resets input.
                input.value = '';
                this.canvas.cv.focus();
            }
        }
    }

    // Allows for addition of commands.
    registerCommand(name, description, callback) {
        this.commands[name] = {
            description: description,
            callback: callback
        };
    }

    // Allows help to print the list of all the commands and their descriptions.
    printHelp() {
        var commands = this.commands;
        for (var cmd in commands) {
            if (commands.hasOwnProperty(cmd)) {
                this.addSystemLine('-' + cmd + ': ' + commands[cmd].description);
            }
        }
    }

    checkLatency() {
        // Ping.
        config.startPingTime = Date.now();
        this.socket.emit('pingcheck');
    }

    toggleDarkMode() {
        if (config.darkMode) {
            config.darkMode = false;
            document.getElementById('darkMode').checked = false;
            config.backgroundColor = config.LIGHT;
            config.lineColor = config.LINELIGHT;
            this.addSystemLine('Dark mode disabled.');
        } else {
            config.darkMode = true;
            document.getElementById('darkMode').checked = true;
            config.backgroundColor = config.DARK;
            config.lineColor = config.LINEDARK;
            this.addSystemLine('Dark mode enabled.');
        }
    }

    toggleBorder() {
        if (!config.borderDraw) {
            config.borderDraw = true;
            this.addSystemLine('Showing border.');
        } else {
            config.borderDraw = false;
            this.addSystemLine('Hiding border.');
        }
    }

    toggleMass() {
        if (config.toggleMassState === 0) {
            config.toggleMassState = 1;
            this.addSystemLine('Viewing mass enabled.');
        } else {
            config.toggleMassState = 0;
            this.addSystemLine('Viewing mass disabled.');
        }
    }

    toggleContinuity() {
        if (!config.continuity) {
            config.continuity = true;
            this.addSystemLine('Continuity enabled.');
        } else {
            config.continuity = false;
            this.addSystemLine('Continuity disabled.');
        }
    }
}

export default ChatClient;
