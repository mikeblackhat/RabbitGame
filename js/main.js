/**
 * main.js
 * Game Orchestrator - Manages the loop, state syncing, and entity updates.
 */


function init(event) {
  console.log("Init starting...");
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
  console.log("Entities created.");

  initUI();
  console.log("UI initialized.");

  if (typeof initMultiplayer === 'function') {
    initMultiplayer();
    console.log("Multiplayer initialized.");
  }

  setupWolfJumpControls();
  console.log("Starting loop.");
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
    obstacles.forEach(obs => obs.update(gameState.delta, gameState.floorRotation));
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

  // Calculate base acceleration
  let currentAccel = (gameConfig.monsterAcceleration + (gameState.level * gameConfig.monsterLevelMultiplier));
  
  // RUBBER-BANDING: If the rabbit is too far ahead, the wolf gets a boost to maintain tension
  if (gameState.proximity > 0.4) {
    const leadBonus = (gameState.proximity - 0.4) * 0.05; // Extra push based on how far ahead the rabbit is
    currentAccel += leadBonus;
  }
  
  gameState.proximityTarget -= currentAccel * gameState.delta;
  
  // Smoothly move proximity towards target
  gameState.proximity += (gameState.proximityTarget - gameState.proximity) * gameState.delta * 2.5;

  if (gameState.gameMode === "endless") {
    if (gameState.proximity < 0.04) { // Lobo has to be closer
      handleMonsterCaught();
    } else if (gameState.proximity > 0.95) { // Rabbit needs a bigger lead to win
      handleRabbitEscaped();
    }
  }
}

function handleRabbitEscaped() {
  const txt = document.getElementById('gameoverText');
  if (txt) txt.innerHTML = '¡ESCAPASTE! 🐰💨';
  gameOver();
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

  // Camera Leaning - Keep both characters in view if possible
  const midAngle = (heroAngle + monsterAngle) / 2;
  updateCameraLeaning(midAngle);
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
  const targetCameraX = -Math.cos(angle) * 15; // Slightly more leaning
  camera.position.x += (targetCameraX - camera.position.x) * gameState.delta * 2;

  // Dynamic zoom based on proximity
  const proximityZoom = Math.max(0, (gameState.proximity - 0.15) * 200);
  const speedZoom = (gameState.speed - gameConfig.initSpeed) / (gameConfig.maxSpeed - gameConfig.initSpeed) * 50;
  
  const targetZ = gameConfig.cameraPosGame + speedZoom + proximityZoom;
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

window.onerror = function(msg, url, lineNo, columnNo, error) {
  var string = msg.toLowerCase();
  var substring = "script error";
  if (string.indexOf(substring) > -1){
    alert('Script Error: See Browser Console for Detail');
  } else {
    var message = [
      'Message: ' + msg,
      'URL: ' + url,
      'Line: ' + lineNo,
      'Column: ' + columnNo,
      'Error object: ' + JSON.stringify(error)
    ].join(' - ');
    console.error(message);
    alert(message);
  }
  return false;
};

window.onload = init;
