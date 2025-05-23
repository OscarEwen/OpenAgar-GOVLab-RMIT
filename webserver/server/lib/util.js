/* jslint node: true */
import config from 'config';

const gameWidth = config.get('game.width');
const gameHeight = config.get('game.height');

const validNick = function (nickname) {
    var regex = /^\w*$/;
    return regex.exec(nickname) !== null;
};

export {validNick};

// determine mass from radius of circle
const massToRadius = function (mass) {
    return 4 + Math.sqrt(mass) * 6;
};

export {massToRadius};

// overwrite Math.log function
const mathLog = (function () {
    var log = Math.log;
    return function (n, base) {
        return log(n) / (base ? log(base) : 1);
    };
})();

export {mathLog};

// get the Euclidean distance between the edges of two shapes
const getDistance = function (p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) - p1.radius - p2.radius;
};

export {getDistance};

const randomInRange = function (from, to) {
    return Math.floor(Math.random() * (to - from)) + from;
};

export {randomInRange};

// generate a random position within the field of play
const randomPosition = function (radius) {
    return {
        x: randomInRange(radius, gameWidth - radius),
        y: randomInRange(radius, gameHeight - radius)
    };
};

export {randomPosition};

const uniformPosition = function (points, radius) {
    let bestCandidate, maxDistance = 0;
    let numberOfCandidates = 10;

    if (points.length === 0) {

        return randomPosition(radius);
    }

    // Generate the candidates
    for (let ci = 0; ci < numberOfCandidates; ci++) {
        let minDistance = Infinity;
        let candidate = randomPosition(radius);
        candidate.radius = radius;

        for (let pi = 0; pi < points.length; pi++) {
            let distance = getDistance(candidate, points[pi]);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }

        if (minDistance > maxDistance) {
            bestCandidate = candidate;
            maxDistance = minDistance;
        } else {
            return randomPosition(radius);
        }
    }

    return bestCandidate;
};

export {uniformPosition};

const findIndex = function (arr, id) {
    let len = arr.length;

    while (len--) {
        if (arr[len].id === id) {
            return len;
        }
    }

    return -1;
};

export {findIndex};

const randomColor = function () {
    let color = '#' + ('00000' + (Math.random() * (1 << 24) | 0).toString(16)).slice(-6);
    let c = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    let r = (parseInt(c[1], 16) - 32) > 0 ? (parseInt(c[1], 16) - 32) : 0;
    let g = (parseInt(c[2], 16) - 32) > 0 ? (parseInt(c[2], 16) - 32) : 0;
    let b = (parseInt(c[3], 16) - 32) > 0 ? (parseInt(c[3], 16) - 32) : 0;

    return {
        fill: color,
        border: '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    };
};

export {randomColor};

const removeNulls = function (inputArray) {
    let result = [];
    for (let element of inputArray) {
        if (element != null) {
            result.push(element);
        }
    }

    return result;
}

export {removeNulls};

// Removes elements from `inputArray` whose indexes are in the `indexes` array.
// Leaves the original array unchanged, and returns the result.
const removeIndexes = function (inputArray, indexes) {
    let nullified = inputArray;
    for (let index of indexes) {
        nullified[index] = null;
    }

    return removeNulls(nullified);
}

export {removeIndexes};

// Checks if the two rectangles are colliding
// width and height is for half values (WTF??)
const testRectangleRectangle =
    function (centerXA, centerYA, widthA, heightA, centerXB, centerYB, widthB, heightB) {
        return centerXA + widthA > centerXB - widthB
            && centerXA - widthA < centerXB + widthB
            && centerYA + heightA > centerYB - heightB
            && centerYA - heightA < centerYB + heightB;
    };

export {testRectangleRectangle};

// Checks if the square (first 3 arguments) and the rectangle (last 4 arguments) are colliding
// length, width and height is for half values (WTF??)
const testSquareRectangle =
    function (centerXA, centerYA, edgeLengthA, centerXB, centerYB, widthB, heightB) {
        return testRectangleRectangle(
            centerXA, centerYA, edgeLengthA, edgeLengthA,
            centerXB, centerYB, widthB, heightB);
    }

export {testSquareRectangle};

const getIndexes = (array, predicate) => {
    return array.reduce((acc, value, index) => {
        if (predicate(value)) {
            acc.push(index)
        }
        return acc;
    }, []);
}

export {getIndexes};