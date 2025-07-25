import * as config from './config.js';

class Canvas {
    constructor(params) {
        this.directionLock = false;
        this.target = config.target;
        this.reenviar = true;
        this.socket = config.socket;
        this.directions = [];
        var self = this;

        this.cv = document.getElementById('cvs');
        this.cv.width = config.screen.width;
        this.cv.height = config.screen.height;
        this.cv.addEventListener('mousemove', this.gameInput, false);
        this.cv.addEventListener('mouseout', this.outOfBounds, false);
        this.cv.addEventListener('keyup', this.keyInput, false);
        this.cv.addEventListener('keyup', function(event) {
            self.reenviar = true;
            self.directionUp(event);
        }, false);
        this.cv.addEventListener('keydown', this.directionDown, false);
        this.cv.addEventListener('touchstart', this.touchInput, false);
        this.cv.addEventListener('touchmove', this.touchInput, false);
        this.cv.parent = self;
        config.canvas = this;
    }

    // Function called when a key is pressed, will change direction if arrow key.
    directionDown(event) {
    	let key = event.key; //which || event.keyCode;
	console.log("directionDown",key)
        let self = this.parent; // have to do this so we are not using the cv object
    	if (self.directional(key)) {
    		self.directionLock = true;
    		if (self.newDirection(key, self.directions, true)) {
			console.log("directionDown",self.directions)
    			self.updateTarget(self.directions);
			console.log("directionDown",self.directions)
    			self.socket.emit('0', self.target);
    		}
    	}
    }

    // Function called when a key is lifted, will change direction if arrow key.
    directionUp(event) {
    	let key = event.key; //which || event.keyCode;
    	if (this.directional(key)) { // this == the actual class
    		if (this.newDirection(key, this.directions, false)) {
    			this.updateTarget(this.directions);
    			if (this.directions.length === 0) this.directionLock = false;
    			this.socket.emit('0', this.target);
    		}
    	}
    }

    // Updates the direction array including information about the new direction.
    newDirection(direction, list, isAddition) {
    	let result = false;
    	let found = false;
    	for (let i = 0, len = list.length; i < len; i++) {
    		if (list[i] == direction) {
    			found = true;
    			if (!isAddition) {
    				result = true;
    				// Removes the direction.
    				list.splice(i, 1);
    			}
    			break;
    		}
    	}
    	// Adds the direction.
    	if (isAddition && found === false) {
    		result = true;
    		list.push(direction);
    	}

    	return result;
    }

    // Updates the target according to the directions in the directions array.
    updateTarget(list) {
    	this.target = { x : 0, y: 0 };
    	let directionHorizontal = 0;
    	let directionVertical = 0;
    	for (let i = 0, len = list.length; i < len; i++) {
    		if (directionHorizontal === 0) {
    			if (list[i] == config.KEY_LEFT) directionHorizontal -= Number.MAX_VALUE;
    			else if (list[i] == config.KEY_RIGHT) directionHorizontal += Number.MAX_VALUE;
    		}
    		if (directionVertical === 0) {
    			if (list[i] == config.KEY_UP) directionVertical -= Number.MAX_VALUE;
    			else if (list[i] == config.KEY_DOWN) directionVertical += Number.MAX_VALUE;
    		}
    	}
    	this.target.x += directionHorizontal;
    	this.target.y += directionVertical;
        config.target = this.target;
    }

    directional(key) {
    	return this.horizontal(key) || this.vertical(key);
    }

    horizontal(key) {
    	return key == config.KEY_LEFT || key == config.KEY_RIGHT;
    }

    vertical(key) {
    	return key == config.KEY_DOWN || key == config.KEY_UP;
    }

    // Register when the mouse goes off the canvas.
    outOfBounds() {
        if (!config.continuity) {
            this.parent.target = { x : 0, y: 0 };
            config.target = this.parent.target;
        }
    }

    gameInput(mouse) {
    	if (!this.directionLock) {
    		this.parent.target.x = mouse.clientX - this.width / 2;
    		this.parent.target.y = mouse.clientY - this.height / 2;
            config.target = this.parent.target;
    	}
    }

    touchInput(touch) {
        touch.preventDefault();
        touch.stopPropagation();
    	if (!this.directionLock) {
    		this.parent.target.x = touch.touches[0].clientX - this.width / 2;
    		this.parent.target.y = touch.touches[0].clientY - this.height / 2;
            config.target = this.parent.target;
    	}
    }

    // Chat command callback functions.
    keyInput(event) {
    	let key = event.key; //which || event.keyCode;
    	if (key === config.KEY_FIREFOOD && this.parent.reenviar) {
            this.parent.socket.emit('1');
            this.parent.reenviar = false;
        }
        else if (key === config.KEY_SPLIT && this.parent.reenviar) {
            document.getElementById('split_cell').play();
            this.parent.socket.emit('2');
            this.parent.reenviar = false;
        }
        else if (key === config.KEY_CHAT) {
            document.getElementById('chatInput').focus();
        }
    }
}

export default Canvas;
