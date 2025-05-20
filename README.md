OpenAgar @ GOVLab RMIT
=============
Forked from Ian Peakes GOVLab fork of the Agario clone project, 

[![GitHub Issues](https://github.com/OscarEwen/OpenAgar-GOVLab-RMIT/issues)]

[![GitHub Wiki](https://github.com/OscarEwen/OpenAgar-GOVLab-RMIT/wiki)]

Live demo not operating as of yet.

A fork of an open source "Agar.IO" clone known as OpenAgar designed to work with the GOVLab display system hosted at RMIT, a 14400x3240 tiled display wall. Built with socket.IO and HTML5 canvas on top of NodeJS.

![Image](screenshot.png)

## Live Demos
An updated live list of demos can be found here when it is up and running.

The OpenAgar URL is not up at the moment.

---

## How to Play
You can check out how to play here when the wiki has been transferred.

#### Game Basics
- Move your mouse around the screen to move your cell.
- Eat food and other players in order to grow your character (food respawns every time a player eats it).
- A player's **mass** is the number of food particles eaten.
- **Objective**: Try to get as big as possible and eat other players.

#### Gameplay Rules
- Players who haven't eaten yet cannot be eaten as a sort of "grace" period. This invincibility fades once they gain mass.
- Everytime a player joins the game, **3** food particles will spawn.
- Everytime a food particle is eaten by a player, **1** new food particle will respawn.
- The more food you eat, the slower you move to make the game fairer for all.

---

## Latest Changes
- Game logic is handled by the server
- The client side is for rendering of the canvas and its items only.
- Mobile optimisation.
- Implementation of working viruses.
- Display player name.
- Now supporting chat. 
- Type`-ping` in the chatbox to check your ping, as well as other commands!

---

## Installation
Will be documented when ready:

#### Requirements
To run / install this game, you'll need: 
- NodeJS with NPM installed.
- socket.IO.
- Express.


#### Downloading the dependencies
After cloning the source code from Github, you need to run the following command to download all the dependencies (socket.IO, express, etc.):

```
npm install
```

#### Running the Server
After downloading all the dependencies, you can run the server with the following command:

```
npm start
```

The game will then be accessible at `http://localhost:3001`. The default port is `3001`, however this can be changed in config. Further elaboration is available on the wiki when setup.


### Running the Server with Docker
If you have [Docker](https://www.docker.com/) installed, after cloning the repository you can run the following commands to start the server and make it acessible at `http://localhost:3001`:

```
docker build -t agarioclone_agar .
docker run -it -p 3001:3001 agarioclone_agar
```

---

This project is licensed under the terms of the **MIT** license.
