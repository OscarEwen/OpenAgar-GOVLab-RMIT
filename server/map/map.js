import * as entityUtils from "../lib/entityUtils.js";

import * as foodUtils from './food.js';
export { foodUtils };

import * as virusUtils from './virus.js';
export { virusUtils };

import * as massFoodUtils from './massFood.js';
export { massFoodUtils };

import * as playerUtils from './player.js';
export { playerUtils };

const Map = class {
    constructor(config) {
        this.food = new foodUtils.FoodManager(config.foodMass, config.foodUniformDisposition);
        this.viruses = new virusUtils.VirusManager(config.virus);
        this.massFood = new massFoodUtils.MassFoodManager();
        this.players = new playerUtils.PlayerManager();
    }

    balanceMass(foodMass, gameMass, maxFood, maxVirus) {
        const totalMass = this.food.data.length * foodMass + this.players.getTotalMass();

        const massDiff = gameMass - totalMass;
        const foodFreeCapacity = maxFood - this.food.data.length;
        const foodDiff = Math.min(parseInt(massDiff / foodMass), foodFreeCapacity);
        if (foodDiff > 0) {
            console.debug('[DEBUG] Adding ' + foodDiff + ' food');
            this.food.addNew(foodDiff);
        } else if (foodDiff && foodFreeCapacity !== maxFood) {
            console.debug('[DEBUG] Removing ' + -foodDiff + ' food');
            this.food.removeExcess(-foodDiff);
        }
        //console.debug('[DEBUG] Mass rebalanced!');

        const virusesToAdd = maxVirus - this.viruses.data.length;
        if (virusesToAdd > 0) {
            this.viruses.addNew(virusesToAdd);
        }
    }

    doPlayerVisibility(currentPlayer,callback) {
        //console.log("doPlayerVisibility",currentPlayer.id,currentPlayer.name,currentPlayer);
        
        let visibleFood = this.food.data.filter(entity => entityUtils.isVisibleEntity(entity, currentPlayer, false));

        let visibleViruses = this.viruses.data.filter(entity => entityUtils.isVisibleEntity(entity, currentPlayer));

        let visibleMass = this.massFood.data.filter(entity => entityUtils.isVisibleEntity(entity, currentPlayer));

        const extractData = (player) => {
            return {
            x: player.x,
            y: player.y,
            cells: player.cells,
            massTotal: Math.round(player.massTotal),
            hue: player.hue,
            id: player.id,
            name: player.name,
                type: player.type
            };
        }
        let visiblePlayers = [];
        for (let player of this.players.data) {
            for (let cell of player.cells) {
            if (entityUtils.isVisibleEntity(cell, currentPlayer)) {
                //if (currentPlayer.id!==player.id) { console.log("player",currentPlayer.id,currentPlayer.name,"sees",player.id,player.name) }
                visiblePlayers.push(extractData(player));
                break;
            }
            }
            //if (currentPlayer.id!==player.id) { console.log("player",currentPlayer.id,currentPlayer.name,"sees",player.id,player.name) }
        }
        callback(extractData(currentPlayer), visiblePlayers, visibleFood, visibleMass, visibleViruses);
    }

    enumerateVisibility(players,callback) {
        for (let currentPlayer of players) {
	    this.doPlayerVisibility(currentPlayer,callback)
	}
    }

    enumerateWhatPlayersSee(callback) {
	this.enumerateVisibility(this.players.data,callback);
    }
}

export { Map };