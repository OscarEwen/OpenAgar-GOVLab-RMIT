from abc import ABC, abstractmethod

import socketio
import time
import threading
import os

GAME_WIDTH = 5000 
GAME_HEIGHT = 5000  

SERVER_URL = os.getenv("OPENAGAR_URL") or os.getenv("SERVER_URL") or "http://localhost:3000"
SCREEN_WIDTH = 1920
SCREEN_HEIGHT = 1080

class agarBot(ABC):
    """Base class to be extended to develop an agar bot."""
    def __init__(self, name):
        self.name = name
        """Name for the bot"""
        self.movement_vector = {
            "x": 0,
            "y": 0,
        }
        """Movement vector with x and y component"""
        self.sio = socketio.Client()
        """Socket IO Object"""
        self.position = {
            "x" : 0,
            "y" : 0,
        }
        """Position vector with x and y component"""
        self.mass = 0
        """Mass scalar of bot"""
        self.cells = []
        """List of cells belonging to bot"""
        self.visiblePlayers = []
        """List of player entities visible to bot"""
        self.visibleFood = []
        """List of food entities visible to bot"""
        self.visibleMass = []
        """List of mass entities (e.g. bait) visible to bot"""
        self.visibleViruses = []
        """List of virus entities visible to bot"""
        self.lastHeartbeat = time.time()
        self.heartbeatInterval = 0.05  # seconds
        self.screenWidth = SCREEN_WIDTH
        self.screen_height = SCREEN_HEIGHT
        self.setup_socket_events()
    
    def setup_socket_events(self):
        """Define different socket events"""
        @self.sio.event
        def connect():
            print(f"{self.name} connected to server")
            self.sio.emit('gotit', {
                'name': self.name,
                'screenWidth': self.screenWidth,
                'screenHeight': self.screen_height
            })
        
        @self.sio.event
        def disconnect():
            print(f"{self.name} disconnected from server")

        @self.sio.event
        def serverTellPlayerMove(player_data, visiblePlayers, visibleFood, visibleMass, visibleViruses):
            # update variables
            self.position = {"x": player_data.get("x", 0), "y": player_data.get("y", 0)}
            self.mass = player_data.get("massTotal", 0)
            self.cells = player_data.get("cells", [])            
            self.visiblePlayers = visiblePlayers
            self.visibleFood = visibleFood
            self.visibleMass = visibleMass
            self.visibleViruses = visibleViruses
    
    def sendHeartbeat(self):
        """Send heartbeat with movement data to server"""
        self.onSendHeartbeat()
        # send the movement vector
        self.sio.emit('0', self.movement_vector)  # '0' is the heartbeat event

    def ejectMass(self):
        """eject small amount of mass function"""
        self.sio.emit('1')  # '1' is the eject mass event

    def split(self):
        """split into smaller cell(s) function"""
        self.sio.emit('2')  # '2' is the split event

    def respawn(self):
        """Send command to server for bot entity to respawn"""
        self.sio.emit('respawn')

    def run(self):
        url_with_query = f"{SERVER_URL}?type=player"
        self.sio.connect(url_with_query)
        
        # start heartbeat thread
        def heartbeatLoop():
            while True:
                self.sendHeartbeat()
                time.sleep(self.heartbeatInterval)
        heartbeatThread = threading.Thread(target=heartbeatLoop)
        heartbeatThread.daemon = True
        heartbeatThread.start()
    
    @abstractmethod
    def onSendHeartbeat(self):
        """Method to be overriden, called once before each heartbeat sent"""
        pass

    