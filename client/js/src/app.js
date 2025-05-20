import io from 'socket.io-client';
import render from './render.js';
import ChatClient from './chat-client.js';
import Canvas from './canvas.js';
import * as config from './config.js';

let playerNameInput = document.getElementById('playerNameInput');
let socket;

let debug = (args) => {
    if (console && console.log) {
        console.log(args);
    }
};

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
    config.mobile = true;
}

function startGame(type) {
    config.playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '').substring(0, 25);
    config.playerType = type;

    config.screen.width = window.innerWidth;
    config.screen.height = window.innerHeight;

    document.getElementById('startMenuWrapper').style.maxHeight = '0px';
    document.getElementById('gameAreaWrapper').style.opacity = 1;
    if (!socket) {
        socket = io(
            { 
                query: {"type" : type}, 
            }
        );
        socket.on("connect_error", (err) => {
            // the reason of the error, for example "xhr poll error"
            console.log(err.message);
          
            // some additional description, for example the status code of the initial HTTP response
            console.log(err.description);
          
            // some additional context, for example the XMLHttpRequest object
            console.log(err.context);
          });
        setupSocket(socket);
    }
    if (!config.animLoopHandle)
        animloop();
    socket.emit('respawn');
    window.chat.socket = socket;
    window.chat.registerFunctions();
    window.canvas.socket = socket;
    config.socket = socket;
}

// Checks if the nick chosen contains valid alphanumeric characters (and underscores).
function validNick() {
    let regex = /^\w*$/;
    debug('Regex Test', regex.exec(playerNameInput.value));
    return regex.exec(playerNameInput.value) !== null;
}

window.onload = () => {

    let btn = document.getElementById('startButton'),
        btnS = document.getElementById('spectateButton'),
        nickErrorText = document.querySelector('#startMenu .input-error');

    btnS.onclick = () => {
        startGame('spectator');
    };

    btn.onclick = () => {

        // Checks if the nick is valid.
        if (validNick()) {
            nickErrorText.style.opacity = 0;
            startGame('player');
        } else {
            nickErrorText.style.opacity = 1;
        }
    };

    let settingsMenu = document.getElementById('settingsButton');
    let settings = document.getElementById('settings');

    settingsMenu.onclick = () => {
        if (settings.style.maxHeight == '300px') {
            settings.style.maxHeight = '0px';
        } else {
            settings.style.maxHeight = '300px';
        }
    };

    playerNameInput.addEventListener('keydown', (e) => {
        let key = e.key; //e.which || e.keyCode;

        if (key === config.KEY_ENTER) {
            if (validNick()) {
                nickErrorText.style.opacity = 0;
                startGame('player');
            } else {
                nickErrorText.style.opacity = 1;
            }
        }
    });
};

// TODO: Break out into GameControls.

let playerConfig = {
    border: 6,
    textColor: '#FFFFFF',
    textBorder: '#000000',
    textBorderSize: 3,
    defaultSize: 30
};

let player = {
    id: -1,
    x: config.screen.width / 2,
    y: config.screen.height / 2,
    screenWidth: config.screen.width,
    screenHeight: config.screen.height,
    target: { 
        x: config.screen.width / 2, 
        y: config.screen.height / 2 
    }
};

config.player = player;

let foods = [];
let viruses = [];
let fireFood = [];
let users = [];
let leaderboard = [];
let target = { 
    x: player.x, 
    y: player.y 
};
config.target = target;

window.canvas = new Canvas();
window.chat = new ChatClient();

let visibleBorderSetting = document.getElementById('visBord');
visibleBorderSetting.onchange = settings.toggleBorder;

let showMassSetting = document.getElementById('showMass');
showMassSetting.onchange = settings.toggleMass;

let continuitySetting = document.getElementById('continuity');
continuitySetting.onchange = settings.toggleContinuity;

let roundFoodSetting = document.getElementById('roundFood');
roundFoodSetting.onchange = settings.toggleRoundFood;

let c = window.canvas.cv;
let graph = c.getContext('2d');

$("#feed").click(() => {
    socket.emit('1');
    window.canvas.reenviar = false;
});

$("#split").click(() => {
    socket.emit('2');
    window.canvas.reenviar = false;
});

function handleDisconnect() {
    socket.close();
    if (!config.kicked) { // We have a more specific error message 
        render.drawErrorMessage('Disconnected!', graph, config.screen);
    }
}

// socket stuff.
function setupSocket(socket) {
    // Handle ping.
    socket.on('pingcheck', () => {
        let latency = Date.now() - config.startPingTime;
        debug('Latency: ' + latency + 'ms');
        window.chat.addSystemLine('Ping: ' + latency + 'ms');
    });

    // Handle error.
    socket.on('connect_error', handleDisconnect);
    socket.on('disconnect', handleDisconnect);

    // Handle connection.
    socket.on('welcome', (playerSettings, gameSizes) => {
        player = playerSettings;
        player.name = config.playerName;
        player.screenWidth = config.screen.width;
        player.screenHeight = config.screen.height;
        player.target = window.canvas.target;
        config.player = player;
        window.chat.player = player;
        socket.emit('gotit', player);
        config.gameStart = true;
        window.chat.addSystemLine('Connected to the game!');
        window.chat.addSystemLine('Type <b>-help</b> for a list of commands.');
        if (config.mobile) {
            document.getElementById('gameAreaWrapper').removeChild(document.getElementById('chatbox'));
        }
        c.focus();
        config.game.width = gameSizes.width;
        config.game.height = gameSizes.height;
        resize();
    });

    socket.on('playerDied', (data) => {
        const player = isUnnamedCell(data.playerEatenName) ? 'An unnamed cell' : data.playerEatenName;
        //const killer = isUnnamedCell(data.playerWhoAtePlayerName) ? 'An unnamed cell' : data.playerWhoAtePlayerName;

        //window.chat.addSystemLine('{GAME} - <b>' + (player) + '</b> was eaten by <b>' + (killer) + '</b>');
        window.chat.addSystemLine('{GAME} - <b>' + (player) + '</b> was eaten');
    });

    socket.on('playerDisconnect', (data) => {
        window.chat.addSystemLine('{GAME} - <b>' + (isUnnamedCell(data.name) ? 'An unnamed cell' : data.name) + '</b> disconnected.');
    });

    socket.on('playerJoin', (data) => {
        window.chat.addSystemLine('{GAME} - <b>' + (isUnnamedCell(data.name) ? 'An unnamed cell' : data.name) + '</b> joined.');
    });

    socket.on('leaderboard', (data) => {
        leaderboard = data.leaderboard;
        let status = '<span class="title">Leaderboard</span>';
        for (let i = 0; i < leaderboard.length; i++) {
            status += '<br />';
            if (leaderboard[i].id == player.id) {
                if (leaderboard[i].name.length !== 0)
                    status += '<span class="me">' + (i + 1) + '. ' + leaderboard[i].name + "</span>";
                else
                    status += '<span class="me">' + (i + 1) + ". An unnamed cell</span>";
            } else {
                if (leaderboard[i].name.length !== 0)
                    status += (i + 1) + '. ' + leaderboard[i].name;
                else
                    status += (i + 1) + '. An unnamed cell';
            }
        }
        //status += '<br />Players: ' + data.players;
        document.getElementById('status').innerHTML = status;
    });

    socket.on('serverMSG', (data) => {
        window.chat.addSystemLine(data);
    });

    // Chat.
    socket.on('serverSendPlayerChat', (data) => {
        window.chat.addChatLine(data.sender, data.message, false);
    });

    // Handle movement.
    socket.on('serverTellPlayerMove', (playerData, userData, foodsList, massList, virusList) => {
	console.log('serverTellPlayerMove',playerData)
	// TODO: change point?
        if (config.playerType == 'player') {
            player.x = playerData.x;
            player.y = playerData.y;
            player.hue = playerData.hue;
            player.massTotal = playerData.massTotal;
            player.cells = playerData.cells;
        }
        users = userData;
        foods = foodsList;
        viruses = virusList;
        fireFood = massList;
    });

    // Death.
    socket.on('RIP', () => {
        config.gameStart = false;
        render.drawErrorMessage('You died!', graph, config.screen);
        window.setTimeout(() => {
            document.getElementById('gameAreaWrapper').style.opacity = 0;
            document.getElementById('startMenuWrapper').style.maxHeight = '1000px';
            if (config.animLoopHandle) {
                window.cancelAnimationFrame(config.animLoopHandle);
                config.animLoopHandle = undefined;
            }
        }, 2500);
    });

    socket.on('kick', (reason) => {
        config.gameStart = false;
        config.kicked = true;
        if (reason !== '') {
            render.drawErrorMessage('You were kicked for: ' + reason, graph, config.screen);
        }
        else {
            render.drawErrorMessage('You were kicked!', graph, config.screen);
        }
        socket.close();
    });
}

const isUnnamedCell = (name) => name.length < 1;

const getPosition = (entity, player, screen) => {
    return {
        x: entity.x - player.x + screen.width / 2,
        y: entity.y - player.y + screen.height / 2
    }
}

function animloop() {
    config.animLoopHandle = window.requestAnimationFrame(animloop);
    gameLoop();
}

function gameLoop() {
    if (config.gameStart) {
        graph.fillStyle = config.backgroundColor;
        graph.fillRect(0, 0, config.screen.width, config.screen.height);

        render.drawGrid(config, player, config.screen, graph);
        foods.forEach(food => {
            let position = getPosition(food, player, config.screen);
            render.drawFood(position, food, graph);
        });
        fireFood.forEach(fireFood => {
            let position = getPosition(fireFood, player, config.screen);
            render.drawFireFood(position, fireFood, playerConfig, graph);
        });
        viruses.forEach(virus => {
            let position = getPosition(virus, player, config.screen);
            render.drawVirus(position, virus, graph);
        });


        let borders = { // Position of the borders on the screen
            left: config.screen.width / 2 - player.x,
            right: config.screen.width / 2 + config.game.width - player.x,
            top: config.screen.height / 2 - player.y,
            bottom: config.screen.height / 2 + config.game.height - player.y
        }
        if (config.borderDraw) {
            render.drawBorder(borders, graph);
        }

        var cellsToDraw = [];
        for (var i = 0; i < users.length; i++) {
            let color = 'hsl(' + users[i].hue + ', 100%, 50%)';
            let borderColor = 'hsl(' + users[i].hue + ', 100%, 45%)';
            for (var j = 0; j < users[i].cells.length; j++) {
                cellsToDraw.push({
                    color: color,
                    borderColor: borderColor,
                    mass: users[i].cells[j].mass,
                    name: users[i].name,
                    radius: users[i].cells[j].radius,
                    x: users[i].cells[j].x - player.x + config.screen.width / 2,
                    y: users[i].cells[j].y - player.y + config.screen.height / 2
                });
            }
        }
        cellsToDraw.sort((obj1, obj2) => {
            return obj1.mass - obj2.mass;
        });
        render.drawCells(cellsToDraw, playerConfig, config.toggleMassState, borders, graph);

        socket.emit('0', window.canvas.target); // playerSendTarget "Heartbeat".
    }
}

window.addEventListener('resize', resize);

function resize() {
    if (!socket) return;

    player.screenWidth = c.width = config.screen.width = config.playerType == 'player' ? window.innerWidth : config.game.width;
    //player.screenWidth = c.width = config.screen.width = window.innerWidth
    player.screenHeight = c.height = config.screen.height = config.playerType == 'player' ? window.innerHeight : config.game.height;
    //player.screenHeight = c.height = config.screen.height =  window.innerHeight

    if (config.playerType == 'spectator') {
        player.x = config.game.width / 2;
        player.y = config.game.height / 2;
    }

    socket.emit(
        'windowResized', 
        { 
            screenWidth: config.screen.width, 
            screenHeight: config.screen.height 
        }
    );
}

