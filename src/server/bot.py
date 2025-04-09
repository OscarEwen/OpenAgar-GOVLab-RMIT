import socketio
import random
import time

# Configuration
SERVER_URL = "http://localhost:3000"  # Update with your server's URL
SCREEN_WIDTH = 1920
SCREEN_HEIGHT = 1080

# Initialize Socket.IO client
sio = socketio.Client()

class Bot:
    def __init__(self, name):
        self.name = name
        self.target = {"x": SCREEN_WIDTH / 2, "y": SCREEN_HEIGHT / 2}

    def connect(self):
        print(f"[RANDYBOT] Connecting as {self.name}...")
        # Add query parameters directly to the URL
        url_with_query = f"{SERVER_URL}?type=player"
        sio.connect(url_with_query)
        sio.emit("gotit", {"name": self.name, "screenWidth": SCREEN_WIDTH, "screenHeight": SCREEN_HEIGHT})
    
    def random_actions(self):
        # Generate a random direction
        direction = {"x": random.uniform(-1, 1), "y": random.uniform(-1, 1)}
        speed = 3  # Adjust the speed of movement

        while True:
            # Update the target position incrementally
            self.target["x"] += direction["x"] * speed
            self.target["y"] += direction["y"] * speed

            # Ensure the bot stays within the screen boundaries
            self.target["x"] = max(0, min(SCREEN_WIDTH, self.target["x"]))
            self.target["y"] = max(0, min(SCREEN_HEIGHT, self.target["y"]))

            # Emit the movement event
            sio.emit("0", self.target)

            # Occasionally change direction
            if random.random() < 0.05:  # 5% chance to change direction
                direction = {"x": random.uniform(-1, 1), "y": random.uniform(-1, 1)}

            # Random split or fire food
            if random.random() < 0.1:
                sio.emit("2")  # Split
                print("[BOT] Split action triggered.")
            if random.random() < 0.05:
                sio.emit("1")  # Fire food
                print("[BOT] Fire food action triggered.")

            time.sleep(0.1)  # Adjust interval for smoother movement
# Event Handlers
@sio.event
def connect():
    print("[RANDYBOT] Connected to the server.")

@sio.event
def disconnect():
    print("[RANDYBOT] Disconnected from the server.")

# Start the bot
if __name__ == "__main__":
    bot = Bot(name=f"RandyBot{random.randint(1000, 9999)}")
    bot.connect()
    bot.random_actions()