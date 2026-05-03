/**
 * Game Configuration and Global State
 */

// Core Constants
const floorRadius = 200;
const initSpeed = 6;
const maxSpeed = 48;
const cameraPosGame = 160;
const cameraPosGameOver = 260;
const monsterAcceleration = 0.004;
const malusClearColor = 0xb44b39;
const malusClearAlpha = 0;

// Global State
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

window.gameState = {
  speed: 0,
  distance: 0,
  level: 1,
  monsterPos: 0.65,
  monsterPosTarget: 0.65,
  floorRotation: 0,
  collisionObstacle: 10,
  collisionBonus: 20,
  gameStatus: "waiting",
  gameMode: "endless", // "endless" or "timeAttack"
  timeRemaining: 45,
  timerInterval: null,
  opponentDistance: 0,
  bestScore: 0,
  bestName: "",
  delta: 0
};
