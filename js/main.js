/**
 * main.js
 * Game Orchestrator - Manages the loop, state syncing, and entity updates.
 */

// Core Three.js variables
var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane,
  globalLight, shadowLight, backLight,
  renderer, container, controls, clock;

// Game Objects
var hero, heroHolder, monster, floor, floorShadow, floorGrass, carrot, obstacle, wolfObstacle, bone, bonusParticles, heart;

// UI Elements (populated in ui.js)
var fieldDistance, fieldDistanceContainer, fieldGameOver;

// Multiplayer state (populated in multiplayer.js)
var isMultiplayer = false, myRole = "rabbit", opponentRole = "";

// Core variables used by prototypes for compatibility
var speed = 0, delta = 0;

function init(event) {
  initScreenAnd3D();
  createLights();
  createFloor();
  createHero();
  createMonster();
  createFirs();
  createCarrot();
  createBonusParticles();
  createObstacle();
  createWolfObstacle();
  createBone();
  createHeart();

  // Initialize UI (defined in js/ui.js)
  initUI();

  setupWolfJumpControls(); // defined in wolfMode.js
  loop();
}

function loop() {
  delta = clock.getDelta();
  gameState.delta = delta;
  speed = gameState.speed;

  updateFloorRotation();

  if (gameState.gameStatus == "play") {
    if (hero.status == "running") {
      hero.run();
    }

    // Mechanics defined in js/game.js
    updateDistance();

    // Local updates
    updateProximity();
    updateEntityPositions();

    // Object updates (encapsulated in js/elements.js)
    carrot.update(gameState.delta, gameState.floorRotation);
    obstacle.update(gameState.delta, gameState.floorRotation);
    if (typeof bone !== 'undefined') bone.update(gameState.delta, gameState.floorRotation);
    if (typeof heart !== 'undefined') heart.update(gameState.delta, gameState.floorRotation);

    // Mode-specific updates
    updateWolfMode(gameState.delta);

    // Collision detection
    checkCollision();
  }

  render();
  requestAnimationFrame(loop);
}

function updateProximity() {
  // Natural separation increase (or decrease if wolf)
  gameState.proximityTarget += gameState.delta * gameState.monsterAcceleration;
  gameState.proximity += (gameState.proximityTarget - gameState.proximity) * gameState.delta;

  if (gameState.gameMode === "endless" && gameState.proximity < 0.06) {
    handleMonsterCaught();
  }
}

function updateEntityPositions() {
  let heroAngle, monsterAngle;

  if (myRole === 'wolf') {
    // Wolf is protagonist (center)
    monsterAngle = Math.PI * 0.5;
    heroAngle = Math.PI * (0.5 - gameState.proximity);
  } else {
    // Rabbit is protagonist (center)
    heroAngle = Math.PI * 0.5;
    monsterAngle = Math.PI * (0.5 + gameState.proximity);
  }

  // Position Rabbit
  heroHolder.position.y = -gameConfig.floorRadius + Math.sin(heroAngle) * gameConfig.floorRadius;
  heroHolder.position.x = Math.cos(heroAngle) * gameConfig.floorRadius;
  heroHolder.rotation.z = -Math.PI / 2 + heroAngle;

  // Position Wolf
  monster.run();
  const jumpBoost = (typeof wolfJumpOff !== 'undefined') ? wolfJumpOff.v : 0;
  monster.mesh.position.y = -gameConfig.floorRadius + Math.sin(monsterAngle) * (gameConfig.floorRadius + 12 + jumpBoost);
  monster.mesh.position.x = Math.cos(monsterAngle) * (gameConfig.floorRadius + 15 + jumpBoost);
  monster.mesh.rotation.z = -Math.PI / 2 + monsterAngle;

  // Camera Leaning - Follow the protagonist
  const focusAngle = (myRole === 'wolf') ? monsterAngle : heroAngle;
  updateCameraLeaning(focusAngle);
}

function handleMonsterCaught() {
  const txt = document.getElementById('gameoverText');
  if (txt) {
    if (typeof myRole !== 'undefined' && myRole === 'wolf') {
      txt.innerHTML = '¡LOBO GANA! 🐺';
    } else if (typeof myRole !== 'undefined' && myRole === 'rabbit') {
      txt.innerHTML = '¡EL LOBO TE ATRAPÓ! 🐺';
    }
  }
  gameOver();
}

function updateCameraLeaning(angle) {
  const targetCameraX = -Math.cos(angle) * 10;
  camera.position.x += (targetCameraX - camera.position.x) * gameState.delta * 2;

  const zoomFactor = (gameState.speed - gameConfig.initSpeed) / (gameConfig.maxSpeed - gameConfig.initSpeed);
  const targetZ = gameConfig.cameraPosGame + zoomFactor * 50;
  camera.position.z += (targetZ - camera.position.z) * gameState.delta;
}

function updateFloorRotation() {
  gameState.floorRotation += gameState.delta * gameState.speed * .01;
  gameState.floorRotation = gameState.floorRotation % (Math.PI * 2);
  floor.rotation.z = gameState.floorRotation;
}

function render() {
  renderer.render(scene, camera);
}

window.onload = init;
