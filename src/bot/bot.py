import socketio
import random
import time
import math
import enum
import threading

GAME_WIDTH = 5000 
GAME_HEIGHT = 5000  

SERVER_URL = "http://localhost:3000"
SCREEN_WIDTH = 1920
SCREEN_HEIGHT = 1080

# bot states
class BotState(enum.Enum):
    Eating = 1
    Attack = 2
    Fleeing = 3
    Dead = 4
    Respawn = 5

# bot events
class BotEvent(enum.Enum):
    SmallerEnemyInRange = 0
    SmallerEnemyOutOfRange = 1
    LargerEnemyInRange = 2
    LargerEnemyOutOfRange = 3
    CaughtByLargerEnemy = 4
    RespawnTimeElapsed = 5
    NowAlive = 6

class Bot:
    def __init__(self, name="RandyBot"):
        self.name = name
        self.sio = socketio.Client()
        self.state = BotState.Eating
        self.target = {"x": 0, "y": 0}
        self.position = {"x": 0, "y": 0}
        self.mass = 0
        self.cells = []
        self.visiblePlayers = []
        self.visibleFood = []
        self.visibleMass = []
        self.visibleViruses = []
        self.timeDead = 0
        self.respawnTime = 3.0  # seconds
        self.lastHeartbeat = time.time()
        self.heartbeatInterval = 0.05  # seconds
        self.screenWidth = SCREEN_WIDTH
        self.screen_height = SCREEN_HEIGHT
        
        # bot behavior parameters
        self.attack_range = 600
        self.flee_range = 700
        self.stop_fleeing_range = 900
        self.massAdvantageRatio = 1.25  # attack when 20% bigger

        # splitting paramaters
        self.lastSplitTime = 0
        self.splitCooldown = 5.0  # seconds
        self.canSplit = True
        
        # Setup socket events
        self.setup_socket_events()
    
    def setup_socket_events(self):
        # defining different socket events
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
            
            # process FSM events based on environment
            self.processEnvironmentEvents()
    
    def processEnvironmentEvents(self):
        if self.state == BotState.Dead:
            return 
        
        # check for enemies
        smallerEnemyInRange = False
        largerEnemyInRange = False
        
        for player in self.visiblePlayers:
            if player.get("id") != self.sio.sid:  # make sure to skip itself
                playerMass = player.get("massTotal", 0)
                playerCells = player.get("cells", [])
                playerPos = {"x": player.get("x", 0), "y": player.get("y", 0)}
                distance = self.distance(self.position, playerPos) # find distance between itself and other player

                smallerCellInRange = False

                if playerCells:
                    for cell in playerCells:
                        cellMass = cell.get("mass", 0)
                        if cellMass * self.massAdvantageRatio < self.mass:
                            smallerCellInRange = True
                            break
                
                if (playerMass * self.massAdvantageRatio < self.mass or smallerCellInRange) and distance < self.attack_range:
                    smallerEnemyInRange = True # if other player is smaller than itself, update to True
                elif playerMass > self.mass * self.massAdvantageRatio and distance < self.flee_range:
                    largerEnemyInRange = True # if other player is larger than itself, update to True
                elif playerMass > self.mass * self.massAdvantageRatio and distance > self.stop_fleeing_range:
                    self.handleEvent(BotEvent.LargerEnemyOutOfRange) 
                    # if other player is larger and out of fleeing range, handle LargerEnemyOutOfRange event
        
        if smallerEnemyInRange:
            self.handleEvent(BotEvent.SmallerEnemyInRange)
            # if smaller player in range, handle SmallerEnemyInRange event
        elif not smallerEnemyInRange and self.state == BotState.Attack:
            self.handleEvent(BotEvent.SmallerEnemyOutOfRange)
            # if smaller player out of range and still in attack state, handle SmallerEnemyOutOfRange event
        if largerEnemyInRange:
            self.handleEvent(BotEvent.LargerEnemyInRange)
            # if larger player in range at any point, handle LargerEnemyInRange event
    
    def FSM_State(self):
        
        # initialize destination
        desiredTarget = {"x": 0, "y": 0}
        
        # TO FIX
        if self.state == BotState.Dead:
            # when dead, don't move
            desiredTarget = self.position.copy()
            
            # update time dead
            self.timeDead += self.heartbeatInterval
            if self.timeDead > self.respawnTime:
                self.handleEvent(BotEvent.RespawnTimeElapsed)
                # once time dead has surpassed respawn time, handle RespawnTimeElapsed event
        
        # TO FIX
        elif self.state == BotState.Respawn:
            self.respawn()
            desiredTarget = self.position.copy()
            # no specific destination required
        
        elif self.state == BotState.Eating:
            # find and move toward nearest food
            food = self.findNearestFood()
            if food:
                desiredTarget = {"x": food.get("x", 0), "y": food.get("y", 0)}
            else:
                # random movement if no food is visible, but stay within game boundaries
                desiredTarget = {
                    "x": random.randint(100, GAME_WIDTH - 100),
                    "y": random.randint(100, GAME_HEIGHT - 100)
                }
        
        elif self.state == BotState.Attack:
            # find and move toward nearest smaller player
            player = self.findNearestSmallerPlayer()
            if player:
                desiredTarget = {"x": player.get("x", 0), "y": player.get("y", 0)}
                
                # splitting to attack behaviour
                distToTarget = self.distance(self.position, desiredTarget)
                currentTime = time.time()

                # check if enough time has passed since last split
                if currentTime - self.lastSplitTime > self.splitCooldown:
                    self.canSplit = True

                # only split if: target is close, we're 2.5x bigger, we're big enough and cooldown has passed
                # <!> Can add random chance to split as opposed to always splitting when in range for easier gameplay <!>
                # <!> Can tweak range for spltting to attack <!>
                if (self.canSplit and self.mass >= player.get("massTotal", 0) * 2.5 and 
                    self.mass > 35 and distToTarget < 150):
                    
                    self.split()
                    
                    # Update split variables
                    self.lastSplitTime = currentTime
                    self.canSplit = False # prevent splitting again until cooldown passes
                    
            else:
                # if no smaller player is found, handle SmallerEnemyOutOfRange event
                self.handleEvent(BotEvent.SmallerEnemyOutOfRange)
                desiredTarget = self.position.copy()
                # no specific destination required
        
        elif self.state == BotState.Fleeing:
            # find nearest larger player and move away
            player = self.findNearestLargerPlayer()
            if player:
                # move away from the larger player
                playerPos = {"x": player.get("x", 0), "y": player.get("y", 0)}
                dx = self.position["x"] - playerPos["x"]
                dy = self.position["y"] - playerPos["y"]
                
                # normalize and scale
                length = math.sqrt(dx**2 + dy**2) # magnitude of direction vector (to enemy)
                if length > 0:
                    dx = dx / length * 1000  # normalize the vector by dividing by its length (turns into a unit vector)
                    dy = dy / length * 1000  # then, multiply by 1000 to travel far into that direction
                
                desiredTarget = {
                    "x": self.position["x"] + dx, # add to current position
                    "y": self.position["y"] + dy
                }

            else:
                # if no larger enemy found, handle LargerEnemyOutOfRange event
                self.handleEvent(BotEvent.LargerEnemyOutOfRange)
                desiredTarget = self.position.copy()
                # no specific destination required
        
        # update the target based on the FSM state
        self.target = desiredTarget
        return desiredTarget
    
    def handleEvent(self, event):
        # dead state transitions
        if self.state == BotState.Dead:
            if event == BotEvent.RespawnTimeElapsed:
                self.setState(BotState.Respawn)
        
        # respawn state transitions
        elif self.state == BotState.Respawn:
            if event == BotEvent.NowAlive:
                self.setState(BotState.Eating)
        
        # eating state transitions
        elif self.state == BotState.Eating:
            if event == BotEvent.SmallerEnemyInRange:
                self.setState(BotState.Attack)
            elif event == BotEvent.LargerEnemyInRange:
                self.setState(BotState.Fleeing)
        
        # attack state transitions
        elif self.state == BotState.Attack:
            if event == BotEvent.SmallerEnemyOutOfRange:
                self.setState(BotState.Eating)
            elif event == BotEvent.LargerEnemyInRange:
                self.setState(BotState.Fleeing)
        
        # fleeing state transitions
        elif self.state == BotState.Fleeing:
            if event == BotEvent.CaughtByLargerEnemy:
                self.setState(BotState.Dead)
                self.timeDead = 0
            elif event == BotEvent.LargerEnemyOutOfRange:
                self.setState(BotState.Eating)
    
    # update states based on new state that is provided
    def setState(self, newState):
        if newState != self.state:
            self.state = newState
    
    # respawn function
    def respawn(self):
        self.sio.emit('respawn')
        self.handleEvent(BotEvent.NowAlive)
    
    # distance calculation function
    def distance(self, pos1, pos2):
        return math.sqrt((pos1["x"] - pos2["x"])**2 + (pos1["y"] - pos2["y"])**2)
    
    # finding the nearest food at a given time
    def findNearestFood(self):
        nearestFood = None
        minDistance = float('inf') # set the min distance to infinity
        
        # find nearest food in food that is visible
        for food in self.visibleFood:
            foodPos = {"x": food.get("x", 0), "y": food.get("y", 0)}
            dist = self.distance(self.position, foodPos)
            if dist < minDistance:
                minDistance = dist
                nearestFood = food

        return nearestFood
    
    # find the closest smaller player to chase
    def findNearestSmallerPlayer(self):
        nearestPlayer = None
        minDistance = float('inf') # set min distance to infinity
        
        for player in self.visiblePlayers:
            if player.get("id") != self.sio.sid:  # make sure to skip itself
                playerMass = player.get("massTotal", 0)
                playerCells = player.get("cells", [])

                smallerCellInRange = False

                if playerCells:
                    for cell in playerCells:
                        cellMass = cell.get("mass", 0)
                        if cellMass * self.massAdvantageRatio < self.mass:
                            smallerCellInRange = True
                            break
                            
                if playerMass * self.massAdvantageRatio < self.mass or smallerCellInRange:
                    playerPos = {"x": player.get("x", 0), "y": player.get("y", 0)}
                    dist = self.distance(self.position, playerPos)
                    if dist < minDistance:
                        minDistance = dist
                        nearestPlayer = player
        
        return nearestPlayer
    
    # find the closest larger player to flee from
    def findNearestLargerPlayer(self):
        nearestPlayer = None
        minDistance = float('inf') # set min distance to infnity
        
        for player in self.visiblePlayers:
            if player.get("id") != self.sio.sid:  # make sure to skip itself
                playerMass = player.get("massTotal", 0)
                if playerMass > self.mass * self.massAdvantageRatio:
                    playerPos = {"x": player.get("x", 0), "y": player.get("y", 0)}
                    dist = self.distance(self.position, playerPos)
                    if dist < minDistance:
                        minDistance = dist
                        nearestPlayer = player
        
        return nearestPlayer
    
    def sendHeartbeat(self):
        if self.state != BotState.Dead and self.state != BotState.Respawn:
            # process the current state and get the target
            self.FSM_State()
            
            # calculate a direction vector from current position to target
            dx = self.target["x"] - self.position["x"]
            dy = self.target["y"] - self.position["y"]
            
            # normalize the vector to a small magnitude
            distance = math.sqrt(dx**2 + dy**2)
            if distance > 0:
                dx = dx / distance * 100  # normalize the vector by dividing by its length (turns into a unit vector)
                dy = dy / distance * 100  # then multiply by a small magnitude 
            
            # Send a target that's a small step in the right direction
            relative_target = {
                "x": dx,
                "y": dy
            }
            
            # send the relative target to the server
            self.sio.emit('0', relative_target)  # '0' is the heartbeat event
    
    
    # split into smaller cell(s) function
    def split(self):
        if self.state != BotState.Dead and self.state != BotState.Respawn:
            self.sio.emit('2')  # '2' is the split event
    
    # eject small amounts of mass function
    def ejectMass(self):
        if self.state != BotState.Dead and self.state != BotState.Respawn:
            self.sio.emit('1')  # '1' is the eject mass event
    
    def run(self):
        try:
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
            
            # keep the main thread alive so that the heartbeat thread keeps executing
            while True:
                time.sleep(1)
        except Exception as e:
            print(f"Error in bot {self.name}: {e}")
        finally:
            if self.sio.connected:
                self.sio.disconnect()


if __name__ == "__main__":
    bot = Bot(name=f"RandyBot{random.randint(1000, 9999)}")
    bot.run()