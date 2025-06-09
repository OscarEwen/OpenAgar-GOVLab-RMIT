import * as util from '../lib/util.js';
import { v4 as uuidv4 } from 'uuid';
import * as entity from "../lib/entityUtils.js";

class Food {
    constructor(position, radius) {
        this.id = uuidv4();
        this.x = position.x;
        this.y = position.y;
        this.radius = radius;
        this.mass = Math.random() + 2;
        this.hue = Math.round(Math.random() * 360);
    }
}

const FoodManager = class {
    constructor(foodMass, foodUniformDisposition) {
        this.data = [];
        this.foodMass = foodMass;
        this.foodUniformDisposition = foodUniformDisposition;
    }

    addNew(number) {
        const radius = util.massToRadius(this.foodMass);
        while (number--) {
            const position = entity.getPosition(this.foodUniformDisposition, radius, this.data)
            this.data.push(new Food(position, radius));
        }
    }

    removeExcess(number) {
        while (number-- && this.data.length) {
            this.data.pop();
        }
    }

    delete(foodsToDelete) {
        if (foodsToDelete.length > 0) {
            this.data = util.removeIndexes(this.data, foodsToDelete);
        }
    }
};

export {FoodManager};