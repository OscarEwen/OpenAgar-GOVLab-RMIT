const util = require("./util");

function getPosition(isUniform, radius, uniformPositions) {
    return isUniform ? util.uniformPosition(uniformPositions, radius) : util.randomPosition(radius);
}

function isVisibleEntity(entity, player, addThreshold = true) {
    const entityHalfSize = entity.radius + (addThreshold ? entity.radius * 0.1 : 0);
    let result = util.testRectangleRectangle(
        entity.x, entity.y, entityHalfSize, entityHalfSize,
        player.x, player.y, player.screenWidth / 2, player.screenHeight / 2);
    //console.log("isVisibleEntity",player.name,"at",player.x,player.y,"sees",entity.constructor.name,entity.name,entity.id,"at",entity.x,entity.y,"screen",player.screenWidth,player.screenHeight);
    return result
}

module.exports = {
    getPosition,
    isVisibleEntity
}
