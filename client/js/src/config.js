export const KEY_ESC = 'Escape';
export const KEY_ENTER = 'Enter';
export const KEY_CHAT = 'Enter';
export const KEY_FIREFOOD = 'w';
export const KEY_SPLIT = ' ';
export const KEY_LEFT = 'ArrowLeft';
export const KEY_UP = 'ArrowUp';
export const KEY_RIGHT = 'ArrowRight';
export const KEY_DOWN = 'ArrowDown';
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