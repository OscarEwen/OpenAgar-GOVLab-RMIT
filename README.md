OpenAgar @ GOVLab RMIT
=============
Forked from Ian Peakes GOVLab fork of the Agario clone project, 

[![GitHub Issues](https://github.com/OscarEwen/OpenAgar-GOVLab-RMIT/issues)]

[![GitHub Wiki](https://github.com/OscarEwen/OpenAgar-GOVLab-RMIT/wiki)]

Live demo not operating as of yet.

A fork of an open source "Agar.IO" clone known as OpenAgar designed to work with the GOVLab display system hosted at RMIT, a 14400x3240 (7m * 3m) tiled display wall. Built with socket.IO and HTML5 canvas on top of NodeJS.

![Image](screenshot.png)

---

## How to Play
You can check out how to play here when the wiki has been transferred.

### Game Basics
- Move your mouse around the screen to move your cell.
- Eat food and other players in order to grow your character (food respawns every time a player eats it).
- A player's **mass** is the number of food particles eaten.
- **Objective**: Try to get as big as possible and eat other players.

### Gameplay Rules
- Players who haven't eaten yet cannot be eaten as a sort of "grace" period. This invincibility fades once they gain mass.
- Everytime a player joins the game, **3** food particles will spawn.
- Everytime a food particle is eaten by a player, **1** new food particle will respawn.
- The more food you eat, the slower you move to make the game fairer for all.

---

## Latest Changes
- Deprecated dependencies have been removed.
- Vulnerable dependencies have been removed.
- Broken initial settings page has been fixed.
- JQuery has been removed.
- Mocha and Chai have been replaced with the native Node test runner.
- Gulp has been replaced with NPM scripts.
- Directory structure has been changed to reduce the amount of files which are copied.
- Bots have been added.
- Example bot scripts bot_fsm.py, botCircleExample.py, and botRectangleExample.py included.
- Base bot class to be extended from agarBot.py included.

---

## Local Setup
The following assumes that the source code has been cloned and a terminal environment is open at the root of the source code.
### Requirements
To run the game server locally, the following are needed: 
- NodeJS with NPM installed.
- Python3 with the following packages installed
    - python-socketio
    - requests
    - websocket-client
### Webserver
#### Dependencies
From root:
1. Change the current directory to the "webserver" directory.
2. Enter the command `npm install`. 

#### Run the Server
From "webserver":
- For production enter the command `npm run start`.
- For development enter the command `npm run watch`.

The game will then be accessible at `http://localhost:3000`. The default port is `3000`, however this can be changed in config. Further elaboration is available on the wiki when setup.

### Start bots
From root:
1. Change the current directory to the "bot" directory.
2. Run `python bot_controller.py -s bot_script.py #`
    - `python` is used for windows systems, if on linux use `python3` instead.
    - `bot_script.py` is the bot script desired to be run.
    - `#` is replaced by the integer number of bots using the specified script.
    - `-s` can be repeated to call different scripts on startup with the same pattern `-s bot_script.py #`.

---

## Docker Setup
### Network
To use the docker containers, a network needs to be created, the application is setup to use the agarnet work which can be created using:
`docker network create agarnet`

### Using Docker Compose
To run the openagar server and bots using docker compose, the following are required:
- docker
- docker-compose

Then run `docker compose build` followed by `docker compose up`, the compose file is configured to spawn 6 FSM bots and have the server accessible at `http://localhost:3000`.

### Using Docker Containers
1. From root change directory to "webserver" `cd webserver/`
2. Build the webserver using the command `docker build -t openagar .`.
3. Enter the command `docker run -it --network=agarnet openagar`.
4. Cd back to the "bot" directory `cd ../bot`
5. Build the bot using the command `docker build -t agarbot .`.
6. Run the bot container using `docker run -it --network=agarnet openagar`.

---

This project is licensed under the terms of the **MIT** license.
