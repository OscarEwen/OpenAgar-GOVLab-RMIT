export const KEY_ESC = 27;
export const KEY_ENTER = 13;
export const KEY_CHAT = 13;
export const KEY_FIREFOOD = 87;
export const KEY_SPLIT = 32;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export let canvas;
export let chatClient;
export let borderDraw = false;
export let mobile = false;
export let screen = {
    width: window.innerWidth,
    height: window.innerHeight
};
export let game = {
    width: 0,
    height: 0
};
export let gameStart = false;
export let disconnected = false;
export let kicked = false;
export let continuity = false;
export let startPingTime = 0;
export let toggleMassState = 0;
export let backgroundColor = '#f2fbff';
export let lineColor = '#000000';
export let player;
export let playerName;
export let playerType;
export let animLoopHandle;
export let socket;
export let target;
export let foodSides;