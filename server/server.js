/*jslint bitwise: true, node: true */
'use strict';

import os from 'node:os';
import express from 'express';
import { createServer } from "http";
import { Server } from 'socket.io';
import SAT from 'sat';

import gameLogic from './game-logic.js';

import loggingRepositry from './repositories/logging-repository.js';
import chatRepository from './repositories/chat-repository.js';
import * as config from '../config.js';
import * as util from './lib/util.js';
import * as mapUtils from './map/map.js';
import * as entityUtils from "./lib/entityUtils.js";

import { spawn } from 'child_process';

const __dirname = import.meta.dirname;

let app = express();

app.get('/', (req, res) => {
    res.sendFile(new URL('./../client/index.html', import.meta.url).pathname);
});

let map = new mapUtils.Map(config);

let sockets = {};
let spectators = [];
let spectatorPlayers = {};

let spectatorNum = spectators.length;
let prevSpectatorNum = null;

let playerNum = map.players.data.length;
let prevPlayerNum = null;

const INIT_MASS_LOG = util.mathLog(config.defaultPlayerMass, config.slowBase);

let leaderboard = [];
let leaderboardChanged = false;

const Vector = SAT.Vector;

const httpServer = createServer(app);
let io = new Server(httpServer, {});

io.engine.on("connection_error", (err) => {
  console.log(err.req);      // the request object
  console.log(err.code);     // the error code, for example 1
  console.log(err.message);  // the error message, for example "Session ID unknown"
  console.log(err.context);  // some additional error context
});

app.use('/', express.static(__dirname + '/../client'));
app.use('/js', express.static(__dirname + '/../client/js'));
app.use('/audio', express.static(__dirname + '/../client/audio'));
app.use('/css', express.static(__dirname + '/../client/css'));
app.use('/img', express.static(__dirname + '/../client/img'));


io.on('connection', (socket) => {
    let type = socket.handshake.query.type;
    console.log('User has connected: ', type);
    switch (type) {
        case 'player':
            addPlayer(socket);
            break;
        case 'spectator':
            addSpectator(socket);
            break;
        default:
            console.log('Unknown user type, not doing anything.');
    };
});

function generateSpawnpoint() {
    let radius = util.massToRadius(config.defaultPlayerMass);
    return entityUtils.getPosition(config.newPlayerInitialPosition === 'farthest', radius, map.players.data)
}


const addPlayer = (socket) => {
    var currentPlayer = new mapUtils.playerUtils.Player(socket.id);

    socket.on('gotit', (clientPlayerData) => {
        console.log('[INFO] Player ' + clientPlayerData.name + ' connecting!');
        currentPlayer.init(generateSpawnpoint(), config.defaultPlayerMass);

        // Store skin if provided
        if (clientPlayerData.skin) {
            currentPlayer.skin = clientPlayerData.skin;
        }

        if (map.players.findIndexByID(socket.id) > -1) {
            console.log('[INFO] Player ID is already connected, kicking.');
            socket.disconnect();
        } else if (!util.validNick(clientPlayerData.name)) {
            socket.emit('kick', 'Invalid username.');
            socket.disconnect();
        } else {
            console.log('[INFO] Player ' + clientPlayerData.name + ' connected!');
            sockets[socket.id] = socket;
            currentPlayer.clientProvidedData(clientPlayerData);
            map.players.pushNew(currentPlayer);
            io.emit('playerJoin', { name: currentPlayer.name });
            console.log('Total players: ' + map.players.data.length);
        }

    });

    socket.on('pingcheck', () => {
        socket.emit('pongcheck');
    });

    socket.on('windowResized', (data) => {
	//console.log("windowResized player",currentPlayer,data);
	currentPlayer.screenWidth = data.screenWidth;
	currentPlayer.screenHeight = data.screenHeight;
    });

    socket.on('respawn', (data) => {
        map.players.removePlayerByID(currentPlayer.id);
        // Save skin on respawn if provided
        if (data && data.skin) {
            currentPlayer.skin = data.skin;
        }
        socket.emit('welcome', currentPlayer, {
            width: config.gameWidth,
            height: config.gameHeight
        });
        console.log('[INFO] User ' + currentPlayer.name + ' has respawned');
    });

    socket.on('disconnect', () => {
        map.players.removePlayerByID(currentPlayer.id);
        console.log('[INFO] User ' + currentPlayer.name + ' has disconnected');
        socket.broadcast.emit('playerDisconnect', { name: currentPlayer.name });
    });

    socket.on('playerChat', (data) => {
        var _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
        var _message = data.message.replace(/(<([^>]+)>)/ig, '');

        if (config.logChat === 1) {
            console.log('[CHAT] [' + (new Date()).getHours() + ':' + (new Date()).getMinutes() + '] ' + _sender + ': ' + _message);
        }

        socket.broadcast.emit('serverSendPlayerChat', {
            sender: _sender,
            message: _message.substring(0, 35)
        });

        chatRepository.logChatMessage(_sender, _message, currentPlayer.ipAddress)
            .catch((err) => console.error("Error when attempting to log chat message", err));
    });

    socket.on('pass', async (data) => {
        const password = data[0];
        if (password === config.adminPass) {
            console.log('[ADMIN] ' + currentPlayer.name + ' just logged in as an admin.');
            socket.emit('serverMSG', 'Welcome back ' + currentPlayer.name);
            socket.broadcast.emit('serverMSG', currentPlayer.name + ' just logged in as an admin.');
            currentPlayer.admin = true;
        } else {
            console.log('[ADMIN] ' + currentPlayer.name + ' attempted to log in with incorrect password.');

            socket.emit('serverMSG', 'Password incorrect, attempt logged.');

            loggingRepositry.logFailedLoginAttempt(currentPlayer.name, currentPlayer.ipAddress)
                .catch((err) => console.error("Error when attempting to log failed login attempt", err));
        }
    });

    socket.on('kick', (data) => {
        if (!currentPlayer.admin) {
            socket.emit('serverMSG', 'You are not permitted to use this command.');
            return;
        }

        var reason = '';
        var worked = false;
        for (let playerIndex in map.players.data) {
            let player = map.players.data[playerIndex];
            if (player.name === data[0] && !player.admin && !worked) {
                if (data.length > 1) {
                    for (var f = 1; f < data.length; f++) {
                        if (f === data.length) {
                            reason = reason + data[f];
                        }
                        else {
                            reason = reason + data[f] + ' ';
                        }
                    }
                }
                if (reason !== '') {
                    console.log('[ADMIN] User ' + player.name + ' kicked successfully by ' + currentPlayer.name + ' for reason ' + reason);
                }
                else {
                    console.log('[ADMIN] User ' + player.name + ' kicked successfully by ' + currentPlayer.name);
                }
                socket.emit('serverMSG', 'User ' + player.name + ' was kicked by ' + currentPlayer.name);
                sockets[player.id].emit('kick', reason);
                sockets[player.id].disconnect();
                map.players.removePlayerByIndex(playerIndex);
                worked = true;
            }
        }
        if (!worked) {
            socket.emit('serverMSG', 'Could not locate user or user is an admin.');
        }
    });

    // Heartbeat function, update everytime.
    socket.on('0', (target) => {
        currentPlayer.lastHeartbeat = new Date().getTime();
        if (target.x !== currentPlayer.x || target.y !== currentPlayer.y) {
            currentPlayer.target = target;
        }
    });

    socket.on('1', () => {
        // Fire food.
        const minCellMass = config.defaultPlayerMass + config.fireFood;
        for (let i = 0; i < currentPlayer.cells.length; i++) {
            if (currentPlayer.cells[i].mass >= minCellMass) {
                currentPlayer.changeCellMass(i, -config.fireFood);
                map.massFood.addNew(currentPlayer, i, config.fireFood);
            }
        }
    });

    socket.on('2', () => {
        currentPlayer.userSplit(config.limitSplit, config.defaultPlayerMass);
    });
}

const addSpectator = (socket) => {
    spectatorPlayers[socket.id] = {}
    socket.on('gotit', function (player) {
        console.log("gotit: spectator", player)	      
	if (socket.id in sockets) {
	  console.log("spectator reconnecting", player)
        } else {
	  console.log("new spectator", player)
          sockets[socket.id] = socket
          spectators.push(socket.id)
	}
	let sx = config.gameWidth / 2
	let sy = config.gameHeight / 2
    let newPlayer = {
        x: sx,
        y: sy,
        cells: [],
        massTotal: 0,
        hue: 100,
        id: socket.id,
        name: player.name,
        type: "spectator",
	}
        spectatorPlayers[socket.id] = newPlayer
	if (player!==null && player!==undefined) {
	  newPlayer.name = player.name
	  newPlayer.x = player.x
	  newPlayer.y = player.y
	  newPlayer.screenWidth = player.screenWidth
	  newPlayer.screenHeight = player.screenHeight
	}
        io.emit('playerJoin', { name: player.name })
    })
    socket.on('windowResized', (data) => {
	let currentPlayer = spectatorPlayers[socket.id];
	console.log("windowResized spectator",currentPlayer,data);
	if (data!==undefined) {
	  currentPlayer.screenWidth = data.screenWidth;
	  currentPlayer.screenHeight = data.screenHeight;
        }
    });
    socket.emit("welcome", {}, {
        width: config.gameWidth,
        height: config.gameHeight
    });
}

const tickPlayer = (currentPlayer) => {
    if (currentPlayer.lastHeartbeat < new Date().getTime() - config.maxHeartbeatInterval) {
        sockets[currentPlayer.id].emit('kick', 'Last heartbeat received over ' + config.maxHeartbeatInterval + ' ago.');
        sockets[currentPlayer.id].disconnect();
    }

    currentPlayer.move(config.slowBase, config.gameWidth, config.gameHeight, INIT_MASS_LOG);

    const isEntityInsideCircle = (point, circle) => {
        return SAT.pointInCircle(new Vector(point.x, point.y), circle);
    };

    const canEatMass = (cell, cellCircle, cellIndex, mass) => {
        if (isEntityInsideCircle(mass, cellCircle)) {
            if (mass.id === currentPlayer.id && mass.speed > 0 && cellIndex === mass.num)
                return false;
            if (cell.mass > mass.mass * 1.1)
                return true;
        }

        return false;
    };

    const canEatVirus = (cell, cellCircle, virus) => {
        return virus.mass < cell.mass && isEntityInsideCircle(virus, cellCircle)
    }

    const cellsToSplit = [];
    for (let cellIndex = 0; cellIndex < currentPlayer.cells.length; cellIndex++) {
        const currentCell = currentPlayer.cells[cellIndex];

        const cellCircle = currentCell.toCircle();

        const eatenFoodIndexes = util.getIndexes(map.food.data, food => isEntityInsideCircle(food, cellCircle));
        const eatenMassIndexes = util.getIndexes(map.massFood.data, mass => canEatMass(currentCell, cellCircle, cellIndex, mass));
        const eatenVirusIndexes = util.getIndexes(map.viruses.data, virus => canEatVirus(currentCell, cellCircle, virus));

        if (eatenVirusIndexes.length > 0) {
            cellsToSplit.push(cellIndex);
            map.viruses.delete(eatenVirusIndexes)
        }

        let massGained = eatenMassIndexes.reduce((acc, index) => acc + map.massFood.data[index].mass, 0);

        map.food.delete(eatenFoodIndexes);
        map.massFood.remove(eatenMassIndexes);
        massGained += (eatenFoodIndexes.length * config.foodMass);
        currentPlayer.changeCellMass(cellIndex, massGained);
    }
    currentPlayer.virusSplit(cellsToSplit, config.limitSplit, config.defaultPlayerMass);
};

const tickGame = () => {
    map.players.data.forEach(tickPlayer);
    map.massFood.move(config.gameWidth, config.gameHeight);

    map.players.handleCollisions(function (gotEaten, eater) {
        const cellGotEaten = map.players.getCell(gotEaten.playerIndex, gotEaten.cellIndex);

        map.players.data[eater.playerIndex].changeCellMass(eater.cellIndex, cellGotEaten.mass);

        const playerDied = map.players.removeCell(gotEaten.playerIndex, gotEaten.cellIndex);
        if (playerDied) {
            let playerGotEaten = map.players.data[gotEaten.playerIndex];
            io.emit('playerDied', { name: playerGotEaten.name }); //TODO: on client it is `playerEatenName` instead of `name`
            sockets[playerGotEaten.id].emit('RIP');
            map.players.removePlayerByIndex(gotEaten.playerIndex);
        }
    });

};

const calculateLeaderboard = () => {
    const topPlayers = map.players.getTopPlayers();

    if (leaderboard.length !== topPlayers.length) {
        leaderboard = topPlayers;
        leaderboardChanged = true;
    } else {
        for (let i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].id !== topPlayers[i].id) {
                leaderboard = topPlayers;
                leaderboardChanged = true;
                break;
            }
        }
    }
}

const gameloop = () => {
    if (map.players.data.length > 0) {
        calculateLeaderboard();
        map.players.shrinkCells(config.massLossRate, config.defaultPlayerMass, config.minMassLoss);
    }

    map.balanceMass(config.foodMass, config.gameMass, config.maxFood, config.maxVirus);
};

const sendUpdates = () => {
    if (spectatorNum != prevSpectatorNum || playerNum != prevPlayerNum) {
        console.log("sendUpdates","spectators",spectators.length,"players",map.players.data.length);
    }
    
    prevSpectatorNum = spectatorNum;
    spectatorNum = spectators.length;

    prevPlayerNum = playerNum;
    playerNum = map.players.data.length;

    spectators.forEach(function (socketID) {
      let player = spectatorPlayers[socketID]
      map.doPlayerVisibility(player, function (playerData, visiblePlayers, visibleFood, visibleMass, visibleViruses) {
        sockets[socketID].emit('serverTellPlayerMove', playerData, visiblePlayers, visibleFood, visibleMass, visibleViruses);
	if (leaderboardChanged) {
	    sendLeaderboard(sockets[socketID])
	}
      })
    })
    map.enumerateWhatPlayersSee(function (playerData, visiblePlayers, visibleFood, visibleMass, visibleViruses) {
        //console.log("sendUpdates player",playerData.id,playerData.name,"sees",visiblePlayers)
        sockets[playerData.id].emit('serverTellPlayerMove', playerData, visiblePlayers, visibleFood, visibleMass, visibleViruses);
        if (leaderboardChanged) {
            sendLeaderboard(sockets[playerData.id])
        }
    })
    leaderboardChanged = false
}

const sendLeaderboard = (socket) => {
    socket.emit('leaderboard', {
        players: map.players.data.length,
        leaderboard
    });
}

const updateSpectator = (socketID) => {
    /*
    let playerData = {
        x: config.gameWidth / 2,
        y: config.gameHeight / 2,
        cells: [],
        massTotal: 0,
        hue: 100,
        id: socketID,
        name: ''
    };
    */
    let playerData = spectatorPlayers[socketID];
    sockets[socketID].emit('serverTellPlayerMove', playerData, map.players.data, map.food.data, map.massFood.data, map.viruses.data);
    if (leaderboardChanged) {
        sendLeaderboard(sockets[socketID]);
    }
}

setInterval(tickGame, 1000 / 60);
setInterval(gameloop, 1000);
setInterval(sendUpdates, 1000 / config.networkUpdateFactor);

// Don't touch, IP configurations.
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || config.host;

var serverport = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || config.port;
httpServer.listen(serverport, ipaddress, () => console.log('[DEBUG] Listening on ' + ipaddress + ':' + serverport));  

// function to spawn bots

function spawnRandyBots(amount) {

    for (let i = 0; i < amount; i++) {

        let python3Cmd = os.platform() == 'win32' ? 'python' : 'python3';

        const pyBotScript = spawn(python3Cmd, ['bot/bot.py']);

        pyBotScript.stdout.on('data', (data) => {//error chks

            console.log(`[RANDYBOT ${i}] ${data}`);

        });

        pyBotScript.stderr.on('data', (data) => {

            console.error(`[RANDYBOT ${i} ERROR] ${data}`);

        });

        pyBotScript.on('close', (code) => {

            console.log(`[RANDYBOT ${i}] Process exited with code ${code}`);

        });

    }

}

// spawn however many bots you want
spawnRandyBots(10);