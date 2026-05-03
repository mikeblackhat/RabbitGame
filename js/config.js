/**
 * Game Configuration and Global State
 */

// Core Constants - Global for compatibility
var floorRadius = 200;
var initSpeed = 12;
var maxSpeed = 48;
var cameraPosGame = 160;
var cameraPosGameOver = 260;
var monsterAcceleration = 0.004;
var malusClearColor = 0xb44b39;
var malusClearAlpha = 0;

var collisionObstacle = 10;
var collisionBonus = 20;

// Global State Object
window.gameState = {
  speed: 0,
  distance: 0,
  level: 1,
  monsterPos: 0.65,
  monsterPosTarget: 0.65,
  monsterAcceleration: 0.004,
  floorRotation: 0,
  collisionObstacle: 10,
  collisionBonus: 20,
  gameStatus: "waiting",
  gameMode: "endless", 
  timeRemaining: 45,
  timerInterval: null,
  opponentDistance: 0,
  bestScore: 0,
  bestName: "",
  delta: 0,
  malusClearAlpha: 0
};

// Global config for reference
window.gameConfig = {
  floorRadius,
  initSpeed,
  maxSpeed,
  cameraPosGame,
  cameraPosGameOver,
  monsterAcceleration,
  malusClearColor,
  malusClearAlpha
};
