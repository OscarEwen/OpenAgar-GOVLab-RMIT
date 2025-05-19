const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { userAgent: 'node.js' };

// --- Canvas Mock Setup ---
const canvasMock = {
    width: 100,
    height: 100,
    style: {},
    getContext: () => ({
        fillRect: () => {},
        clearRect: () => {},
    }),
    focus: () => {},
    onchange: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
};
// Always return the same mock for 'canvas'
global.document.getElementById = function(id) {
    if (id === 'canvas') return canvasMock;
    return {
        style: {},
        focus: () => {},
        onchange: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
        getContext: () => ({
            fillRect: () => {},
            clearRect: () => {},
        }) // Ensure getContext exists for all elements
    };
};
// Ensure global.c is the same mock as returned by getElementById('canvas')
global.c = canvasMock;
// -------------------------------------------------------------

// --- Add a global mock for settings before requiring app.js ---
global.settings = {}; // Add any required default properties if needed
// -------------------------------------------------------------

// --- Add a global mock for $ before requiring app.js ---
global.$ = () => ({ click: () => {} });
// -------------------------------------------------------------

const { expect } = require('chai');
let app = require('../src/client/js/app');


describe('gameLoop entity skins', () => {
    let render, global, playerConfig, player, users, foods, fireFood, viruses, socket, graph, windowMock, originalRequire;

    function createSpy() {
        const spy = function(...args) {
            spy.called = true;
            spy.callCount++;
            spy.lastCall = { args };
            spy.calls.push({ args });
        };
        spy.called = false;
        spy.callCount = 0;
        spy.lastCall = null;
        spy.calls = [];
        spy.calledWith = function(val) {
            return spy.calls.some(call => call.args[0] === val);
        };
        return spy;
    }

    // Helper to reload app.js with fresh mocks
    function loadAppWithMocks() {
        // Mock render module
        render = {
            drawGrid: createSpy(),
            drawFood: createSpy(),
            drawFireFood: createSpy(),
            drawVirus: createSpy(),
            drawBorder: createSpy(),
            drawCells: createSpy(),
            drawErrorMessage: createSpy()
        };
        // Mock global
        global = {
            gameStart: false,
            backgroundColor: '#fff',
            screen: { width: 100, height: 100 },
            game: { width: 1000, height: 1000 },
            borderDraw: false,
            toggleMassState: 0
        };
        playerConfig = { border: 6 };
        player = {
            x: 0, y: 0, id: 1, screenWidth: 100, screenHeight: 100
        };
        // Instead of reassigning, clear arrays in place to preserve references
        if (!users) users = [];
        users.length = 0;
        if (!foods) foods = [];
        foods.length = 0;
        if (!fireFood) fireFood = [];
        fireFood.length = 0;
        if (!viruses) viruses = [];
        viruses.length = 0;
        socket = { emit: createSpy() };
        graph = {
            fillStyle: '',
            fillRect: createSpy()
        };
        // Patch window and document
        windowMock = {
            requestAnimFrame: cb => setTimeout(cb, 0),
            cancelAnimFrame: () => {},
            canvas: { cv: { getContext: () => graph } },
            chat: { registerFunctions: () => {}, addSystemLine: () => {}, addChatLine: () => {}, player: {} }
        };
        global.player = player;
        global.animLoopHandle = undefined;
        global.playerType = 'player';
        global.mobile = false;
        global.kicked = false;
        global.gameStart = false;
        global.socket = socket;
        global.playerConfig = playerConfig;
        global.target = { x: 0, y: 0 };
        // Patch required modules
        originalRequire = require.cache[require.resolve('../src/client/js/render')];
        require.cache[require.resolve('../src/client/js/render')] = { exports: render };
        require.cache[require.resolve('../src/client/js/global')] = { exports: global };
        require.cache[require.resolve('../src/client/js/canvas')] = { exports: function() { this.cv = { getContext: () => graph }; } };
        require.cache[require.resolve('../src/client/js/chat-client')] = { exports: function() { this.registerFunctions = () => {}; } };
        // Patch variables in app.js scope
        global.playerConfig = playerConfig;
        global.player = player;
        global.users = users;
        global.foods = foods;
        global.fireFood = fireFood;
        global.viruses = viruses;
        global.socket = socket;
        global.graph = graph;
        // Patch c to always be the shared canvasMock
        global.c = canvasMock;
        // Also patch global.c in the global object for app.js compatibility
        global.global = global;
        global.window = windowMock;
        global.document = {
            getElementById: id => id === 'canvas' ? canvasMock : {
                style: {},
                focus: () => {},
                onchange: () => {},
                removeEventListener: () => {},
                addEventListener: () => {},
                dispatchEvent: () => {},
                getContext: () => ({
                    fillRect: () => {},
                    clearRect: () => {},
                }) // Ensure getContext exists for all elements
            },
            querySelector: () => ({ style: {} })
        };
        // Load app.js
        delete require.cache[require.resolve('../src/client/js/app')];
        app = require('../src/client/js/app');
        // Ensure app.gameLoop is available for tests
        if (!app || typeof app.gameLoop !== 'function') {
            app = app || {};
            app.gameLoop = global.gameLoop;
        }
        // Patch: point test arrays to the same arrays used by app.js
        users = global.users;
        foods = global.foods;
        fireFood = global.fireFood;
        viruses = global.viruses;
    }

    beforeEach(() => {
        loadAppWithMocks();
        global.gameStart = true;
        global.users = users;
        global.foods = foods;
        global.fireFood = fireFood;
        global.viruses = viruses;
        global.player = player;
        global.playerConfig = playerConfig;
        global.graph = graph;
        global.socket = socket;
    });

    afterEach(() => {
        // Restore original require cache
        if (originalRequire) {
            require.cache[require.resolve('../src/client/js/render')] = originalRequire;
        }
    });

    it('should not render if gameStart is false', () => {
        global.gameStart = false;
        app.gameLoop();
        expect(render.drawGrid.called).to.be.false;
        expect(render.drawCells.called).to.be.false;
    });

    it('should fill background and draw grid when gameStart is true', () => {
        app.gameLoop();
        expect(graph.fillRect.called).to.be.true;
        expect(render.drawGrid.called).to.be.true;
    });

    it('should use imageSkin if skin.type is image', () => {
        users.length = 0;
        users.push({
            skin: { type: 'image', value: 'emoji1.png' },
            hue: 123,
            name: 'imguser',
            cells: [{ mass: 10, radius: 5, x: 10, y: 10 }]
        });
        app.gameLoop();
        // Defensive: ensure drawCells was called and args exist
        expect(render.drawCells.lastCall, 'drawCells was not called').to.exist;
        expect(render.drawCells.lastCall.args[0], 'drawCells args missing').to.exist;
        const cellsArg = render.drawCells.lastCall.args[0];
        expect(cellsArg[0], 'drawCells first cell missing').to.exist;
        expect(cellsArg[0].imageSkin).to.equal('emoji1.png');
        expect(cellsArg[0].color).to.equal('#ffffff');
        expect(cellsArg[0].borderColor).to.equal('#cccccc');
    });

    it('should use color if skin.type is color', () => {
        users.length = 0;
        users.push({
            skin: { type: 'color', value: '#00ff00' },
            hue: 123,
            name: 'coloruser',
            cells: [{ mass: 10, radius: 5, x: 10, y: 10 }]
        });
        app.gameLoop();
        expect(render.drawCells.lastCall, 'drawCells was not called').to.exist;
        expect(render.drawCells.lastCall.args[0], 'drawCells args missing').to.exist;
        const cellsArg = render.drawCells.lastCall.args[0];
        expect(cellsArg[0], 'drawCells first cell missing').to.exist;
        expect(cellsArg[0].color).to.equal('#00ff00');
        expect(cellsArg[0].borderColor).to.equal('#00ff00');
        expect(cellsArg[0].imageSkin).to.be.null;
    });

    it('should fallback to hue if no skin', () => {
        users.length = 0;
        users.push({
            skin: undefined,
            hue: 42,
            name: 'hueuser',
            cells: [{ mass: 10, radius: 5, x: 10, y: 10 }]
        });
        app.gameLoop();
        expect(render.drawCells.lastCall, 'drawCells was not called').to.exist;
        expect(render.drawCells.lastCall.args[0], 'drawCells args missing').to.exist;
        const cellsArg = render.drawCells.lastCall.args[0];
        expect(cellsArg[0], 'drawCells first cell missing').to.exist;
        expect(cellsArg[0].color).to.equal('hsl(42, 100%, 50%)');
        expect(cellsArg[0].borderColor).to.equal('hsl(42, 100%, 45%)');
    });

    it('should treat string skin ending with .png as image', () => {
        users.length = 0;
        users.push({
            skin: 'emoji2.png',
            hue: 99,
            name: 'imgstr',
            cells: [{ mass: 10, radius: 5, x: 10, y: 10 }]
        });
        app.gameLoop();
        expect(render.drawCells.lastCall, 'drawCells was not called').to.exist;
        expect(render.drawCells.lastCall.args[0], 'drawCells args missing').to.exist;
        const cellsArg = render.drawCells.lastCall.args[0];
        expect(cellsArg[0], 'drawCells first cell missing').to.exist;
        expect(cellsArg[0].imageSkin).to.equal('emoji2.png');
        expect(cellsArg[0].color).to.equal('#ffffff');
        expect(cellsArg[0].borderColor).to.equal('#cccccc');
    });

    it('should treat string skin not ending with .png as color', () => {
        users.length = 0;
        users.push({
            skin: '#abcdef',
            hue: 88,
            name: 'colorstr',
            cells: [{ mass: 10, radius: 5, x: 10, y: 10 }]
        });
        app.gameLoop();
        expect(render.drawCells.lastCall, 'drawCells was not called').to.exist;
        expect(render.drawCells.lastCall.args[0], 'drawCells args missing').to.exist;
        const cellsArg = render.drawCells.lastCall.args[0];
        expect(cellsArg[0], 'drawCells first cell missing').to.exist;
        expect(cellsArg[0].color).to.equal('#abcdef');
        expect(cellsArg[0].borderColor).to.equal('#abcdef');
        expect(cellsArg[0].imageSkin).to.be.null;
    });

    it('should emit heartbeat event after drawing', () => {
        app.gameLoop();
        expect(socket.emit.calledWith('0')).to.be.true;
    });
});