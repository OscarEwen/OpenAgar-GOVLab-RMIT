import * as util from '../lib/util.js';
import { v4 as uuidv4 } from 'uuid';
import * as entity from "../lib/entityUtils.js";

class Virus {
    constructor(position, radius, mass, config) {
        this.id = uuidv4();
        this.x = position.x;
        this.y = position.y;
        this.radius = radius;
        this.mass = mass;
        this.fill = config.fill;
        this.stroke = config.stroke.color;
        this.strokeWidth = config.stroke.width;
    }
}

const VirusManager = class {
    constructor(virusConfig) {
        this.data = [];
        this.virusConfig = virusConfig;
    }

    pushNew(virus) {
        this.data.push(virus);
    }

    addNew(number) {
        while (number--) {
            var mass = util.randomInRange(this.virusConfig.mass.min, this.virusConfig.mass.max);
            var radius = util.massToRadius(mass);
            var position = entity.getPosition(this.virusConfig.uniformDisposition, radius, this.data);
            var newVirus = new Virus(position, radius, mass, this.virusConfig);
            this.pushNew(newVirus);
        }
    }

    delete(virusCollision) {
        this.data.splice(virusCollision, 1);
    }
};

export { VirusManager };