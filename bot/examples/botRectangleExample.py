from agarBot import agarBot
import math

class botRectangle(agarBot):
    """simply moves in a rectangle"""
    def __init__(self):
        super().__init__('Rectangle')
        self.t = 0
        pass

    def onSendHeartbeat(self):
        self.t += 1
        if (self.t <= 100) :
            self.movement_vector = {
                "x" : 100,
                "y" : 0
            }
        elif (self.t <= 200) :
            self.movement_vector = {
                "x" : 0,
                "y" : 100
            }
        elif (self.t <= 300) :
            self.movement_vector = {
                "x" : -100,
                "y" : 0
            }
        elif (self.t <= 400) :
            self.movement_vector = {
                "x" : 0,
                "y" : -100
            }
            if (self.t == 400) :
                self.t = 0
        return super().onSendHeartbeat()