from agarBot import agarBot
import math

class botRectangle(agarBot):
    """simply moves in a circle"""
    def __init__(self):
        super().__init__('Circle')
        self.t = 0
        pass

    def onSendHeartbeat(self):
        self.t += 1
        self.movement_vector = {
            "x" : 100 * math.cos(self.t/10),
            "y" : 100 * math.sin(self.t/10)
        }
        return super().onSendHeartbeat()