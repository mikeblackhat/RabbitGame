/**
 * Game Configuration and Global State
 */

// Core Constants - Global for compatibility
var floorRadius = 200;
var initSpeed = 30;
var maxSpeed = 75;
var cameraPosGame = 160;
var cameraPosGameOver = 260;
var monsterAcceleration = 0.0075;
var monsterLevelMultiplier = 0.001;
var malusClearColor = 0xb44b39;
var malusClearAlpha = 0;

// Core Three.js variables
var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane,
  globalLight, shadowLight, backLight,
  renderer, container, controls, clock;

var collisionObstacle = 10;
var collisionBonus = 20;

// Global Game Objects
var hero, heroHolder, monster, floor, floorShadow, floorGrass, carrot, obstacle, wolfObstacle, bone, bonusParticles, heart;
var fieldDistance, fieldDistanceContainer, fieldGameOver;
var isMultiplayer = false, myRole = "rabbit", opponentRole = "";
var speed = 0, delta = 0;

// Global State Object
window.gameState = {
  speed: 0,
  distance: 0,
  level: 1,
  proximity: 0.22, // Increased lead (was 0.15)
  proximityTarget: 0.22,
  monsterAcceleration: 0.0075,
  monsterLevelMultiplier: 0.001,
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
  floorRadius: 200,
  initSpeed: 30,
  maxSpeed: 75,
  cameraPosGame: 160,
  cameraPosGameOver: 260,
  monsterAcceleration: 0.0075,
  monsterLevelMultiplier: 0.001,
  malusClearColor: 0xb44b39,
  malusClearAlpha: 0
};
