/**
 * Main Game Entry Point - Orchestrates the game loop and initialization
 */

// Core Three.js variables
var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    globalLight, shadowLight, backLight,
    renderer, container, controls, clock;

var heart; // Still global for easy access in elements creation

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

  gameState.gameStatus = "waiting";
  
  setupWolfJumpControls(); // defined in wolfMode.js
  loop();
}

function loop() {
  gameState.delta = clock.getDelta();
  
  updateFloorRotation();

  if (gameState.gameStatus == "play") {
    if (hero.status == "running") {
      hero.run();
    }
    
    // Mechanics defined in js/game.js
    updateDistance();
    
    // Local updates
    updateMonsterPosition();
    
    // Object updates (encapsulated in js/elements.js)
    carrot.update(gameState.delta, gameState.floorRotation);
    obstacle.update(gameState.delta, gameState.floorRotation);
    if (heart) heart.update(gameState.delta, gameState.floorRotation);

    if (myRole === 'wolf') {
      updateWolfMode(gameState.delta);
      if (typeof bone !== 'undefined') bone.update(gameState.delta, gameState.floorRotation);
      checkCollision();
    } else if (myRole === 'rabbit') {
      checkCollision();
    }
  }

  render();
  requestAnimationFrame(loop);
}

function updateMonsterPosition() {
  monster.run();
  gameState.monsterPosTarget -= gameState.delta * gameState.monsterAcceleration;
  gameState.monsterPos += (gameState.monsterPosTarget - gameState.monsterPos) * gameState.delta;
  
  if (gameState.monsterPos < .56) {
    handleMonsterCaught();
  }

  const angle = Math.PI * gameState.monsterPos;
  const jumpBoost = (typeof wolfJumpOff !== 'undefined') ? wolfJumpOff.v : 0;
  
  monster.mesh.position.y = -gameConfig.floorRadius + Math.sin(angle) * (gameConfig.floorRadius + 12 + jumpBoost);
  monster.mesh.position.x = Math.cos(angle) * (gameConfig.floorRadius + 15 + jumpBoost);
  monster.mesh.rotation.z = -Math.PI / 2 + angle;

  updateCameraLeaning(angle);
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
  // Dynamic Camera Leaning & Zoom
  const targetCameraX = -Math.cos(angle) * 10;
  camera.position.x += (targetCameraX - camera.position.x) * gameState.delta * 2;

  // Zoom out as speed increases
  const zoomFactor = (gameState.speed - gameConfig.initSpeed) / (gameConfig.maxSpeed - gameConfig.initSpeed);
  const targetZ = gameConfig.cameraPosGame + zoomFactor * 60;
  camera.position.z += (targetZ - camera.position.z) * gameState.delta * 1.5;

  camera.lookAt(new THREE.Vector3(0, 30, 0));
}

function updateFloorRotation() {
  gameState.floorRotation += gameState.delta * .03 * gameState.speed;
  gameState.floorRotation = gameState.floorRotation % (Math.PI * 2);
  floor.rotation.z = gameState.floorRotation;
}

function createHeart() {
  heart = new LifeHeart();
  heart.mesh.visible = false;
  scene.add(heart.mesh);
}

function render() {
  renderer.render(scene, camera);
}

window.addEventListener('load', init, false);
