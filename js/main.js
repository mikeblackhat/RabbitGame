//THREEJS RELATED VARIABLES 

var scene,
  camera, fieldOfView, aspectRatio, nearPlane, farPlane,
  globalLight, shadowLight, backLight,
  renderer,
  container,
  controls,
  clock;
var delta = 0;
var floorRadius = 200;
var speed = 0; // Starts at 0 to prevent rotation before start
var distance = 0;
var level = 1;
var heart;
var initSpeed = 10;
var maxSpeed = 42; // Lowered from 48 for better visibility
var monsterPos = .65;
var monsterPosTarget = .65;
var floorRotation = 0;
var collisionObstacle = 10;
var collisionBonus = 20;
var gameStatus = "play";
var cameraPosGame = 160;
var cameraPosGameOver = 260;
var monsterAcceleration = 0.004;
var malusClearColor = 0xb44b39;
var malusClearAlpha = 0;
var gameMode = "endless"; // "endless" or "timeAttack"
var timeRemaining = 45;
var timerInterval = null;
var opponentDistance = 0;


function updateMonsterPosition() {
  monster.run();
  monsterPosTarget -= delta * monsterAcceleration;
  monsterPos += (monsterPosTarget - monsterPos) * delta;
  if (monsterPos < .56) {
    if (typeof myRole !== 'undefined' && myRole === 'wolf') {
      var txt = document.getElementById('gameoverText');
      if (txt) txt.innerHTML = '¡LOBO GANA! 🐺';
    } else if (typeof myRole !== 'undefined' && myRole === 'rabbit') {
      var txt = document.getElementById('gameoverText');
      if (txt) txt.innerHTML = '¡EL LOBO TE ATRAPÓ! 🐺';
    }
    gameOver();
  }

  var angle = Math.PI * monsterPos;
  // wolfJumpOff.v > 0 when the wolf player is mid-jump (wolfMode.js)
  var jumpBoost = (typeof wolfJumpOff !== 'undefined') ? wolfJumpOff.v : 0;
  monster.mesh.position.y = -floorRadius + Math.sin(angle) * (floorRadius + 12 + jumpBoost);
  monster.mesh.position.x = Math.cos(angle) * (floorRadius + 15 + jumpBoost);
  monster.mesh.rotation.z = -Math.PI / 2 + angle;

  // Dynamic Camera Leaning & Zoom (UI/UX Skill)
  var targetCameraX = -Math.cos(angle) * 10;
  camera.position.x += (targetCameraX - camera.position.x) * delta * 2;

  // Zoom out as speed increases to help visibility
  var zoomFactor = (speed - initSpeed) / (maxSpeed - initSpeed);
  var targetZ = cameraPosGame + zoomFactor * 60;
  camera.position.z += (targetZ - camera.position.z) * delta * 1.5;

  camera.lookAt(new THREE.Vector3(0, 30, 0));
}


var bestScore = 0;
var bestName = "";

function gameOver() {
  var d = Math.floor(distance / 2);
  var winner = 'wolf'; // Default

  var txt = document.getElementById('gameoverText');
  if (txt) {
    if (txt.innerHTML.includes('CONEJO GANADOR') || txt.innerHTML.includes('ESCPA')) {
      winner = 'rabbit';
    }
  }

  if (d > bestScore) {
    gameStatus = "enteringName";
    document.getElementById("newHighScoreScreen").style.display = "flex";
    var nameInput = document.getElementById("playerNameInput");
    if (nameInput) {
      nameInput.value = "";
      nameInput.focus();
    }
    window.pendingHighScore = d;
  } else {
    gameStatus = "readyToReplay";
  }

  playEndGameAnimation(winner);

  if (isMultiplayer) {
    sendData({ type: 'gameOver', distance: d });
  }
}

function replay() {

  gameStatus = "preparingToReplay"

  fieldGameOver.className = "";
  var txt = document.getElementById('gameoverText');
  if (txt) txt.innerHTML = "Fin del juego";
  var overlay = document.getElementById("gameOverOverlay");
  if (overlay) overlay.className = "";

  // Return the distance score to its original position
  TweenMax.to(fieldDistanceContainer, 1, { top: "5%", scale: 1, xPercent: -50, ease: Power4.easeInOut });

  TweenMax.killTweensOf(monster.pawFL.position);
  TweenMax.killTweensOf(monster.pawFR.position);
  TweenMax.killTweensOf(monster.pawBL.position);
  TweenMax.killTweensOf(monster.pawBR.position);

  TweenMax.killTweensOf(monster.pawFL.rotation);
  TweenMax.killTweensOf(monster.pawFR.rotation);
  TweenMax.killTweensOf(monster.pawBL.rotation);
  TweenMax.killTweensOf(monster.pawBR.rotation);

  TweenMax.killTweensOf(monster.tail.rotation);
  TweenMax.killTweensOf(monster.head.rotation);
  TweenMax.killTweensOf(monster.eyeL.scale);
  TweenMax.killTweensOf(monster.eyeR.scale);

  //TweenMax.killTweensOf(hero.head.rotation);

  monster.tail.rotation.y = 0;

  // Camera will be handled by cinematicEntry or the resetGame flow to avoid redundant jumps
  TweenMax.to(monster.torso.rotation, 2, { x: 0, ease: Power4.easeInOut });
  TweenMax.to(monster.torso.position, 2, { y: 0, ease: Power4.easeInOut });
  TweenMax.to(monster.pawFL.rotation, 2, { x: 0, ease: Power4.easeInOut });
  TweenMax.to(monster.pawFR.rotation, 2, { x: 0, ease: Power4.easeInOut });
  TweenMax.to(monster.mouth.rotation, 2, { x: .5, ease: Power4.easeInOut });


  TweenMax.to(monster.head.rotation, 2, { y: 0, x: -.3, ease: Power4.easeInOut });

  TweenMax.to(hero.mesh.position, 2, { x: 20, ease: Power4.easeInOut });
  TweenMax.to(hero.head.rotation, 2, { x: 0, y: 0, ease: Power4.easeInOut });
  TweenMax.to(monster.mouth.rotation, 2, { x: .2, ease: Power4.easeInOut });
  TweenMax.to(monster.mouth.rotation, 1, {
    x: .4, ease: Power4.easeIn, delay: 1, onComplete: function () {

      resetGame();
    }
  });

}

function updateCarrotPosition() {
  carrot.mesh.rotation.y += delta * 6;
  carrot.mesh.rotation.z = Math.PI / 2 - (floorRotation + carrot.angle);
  carrot.mesh.position.y = -floorRadius + Math.sin(floorRotation + carrot.angle) * (floorRadius + 50);
  carrot.mesh.position.x = Math.cos(floorRotation + carrot.angle) * (floorRadius + 50);

}

function updateBonePosition() {
  if (typeof bone === 'undefined') return;
  bone.mesh.rotation.y += delta * 6;
  bone.mesh.rotation.z = Math.PI / 2 - (floorRotation + bone.angle);
  bone.mesh.position.y = -floorRadius + Math.sin(floorRotation + bone.angle) * (floorRadius + 50);
  bone.mesh.position.x = Math.cos(floorRotation + bone.angle) * (floorRadius + 50);
}

function updateHeartPosition() {
  if (!heart || !heart.mesh.visible) return;
  heart.mesh.rotation.y += delta * 6;
  heart.mesh.rotation.z = Math.PI / 2 - (floorRotation + heart.angle);
  // Elevation set to 40 units (jump required)
  heart.mesh.position.y = -floorRadius + Math.sin(floorRotation + heart.angle) * (floorRadius + 40);
  heart.mesh.position.x = Math.cos(floorRotation + heart.angle) * (floorRadius + 40);
}

function updateObstaclePosition() {
  if (obstacle.status == "flying") return;

  if (floorRotation + obstacle.angle > 3.0) {
    obstacle.angle = -floorRotation + Math.random() * .3;
    obstacle.body.rotation.y = Math.random() * Math.PI * 2;
  }

  obstacle.mesh.rotation.z = floorRotation + obstacle.angle - Math.PI / 2;
  obstacle.mesh.position.y = -floorRadius + Math.sin(floorRotation + obstacle.angle) * (floorRadius + 3);
  obstacle.mesh.position.x = Math.cos(floorRotation + obstacle.angle) * (floorRadius + 3);
}

function updateFloorRotation() {
  floorRotation += delta * .03 * speed;
  floorRotation = floorRotation % (Math.PI * 2);
  floor.rotation.z = floorRotation;
}



function updateLevel() {
  level++;

  // Alternate between Day and Night every level (100m)
  var newBg, newLightColor;
  if (level % 2 === 0) { // Night
    newBg = "#1a1a2e";
    newLightColor = "#4a4e69";
  } else { // Day
    newBg = "#dbe6e6";
    newLightColor = "#ffffff";
  }

  if (newBg) {
    // Animate DOM Background (Slow transition of 5 seconds)
    TweenMax.to(document.getElementById("world"), 5, { backgroundColor: newBg });
    // Animate 3D Fog
    var parsedColor = new THREE.Color(newBg);
    TweenMax.to(scene.fog.color, 5, { r: parsedColor.r, g: parsedColor.g, b: parsedColor.b });
    // Animate Lights
    var parsedLight = new THREE.Color(newLightColor);
    TweenMax.to(globalLight.color, 5, { r: parsedLight.r, g: parsedLight.g, b: parsedLight.b });
    TweenMax.to(shadowLight.color, 5, { r: parsedLight.r, g: parsedLight.g, b: parsedLight.b });
  }
}

function loop() {
  delta = clock.getDelta();
  updateFloorRotation();

  if (gameStatus == "play") {

    if (hero.status == "running") {
      hero.run();
    }
    updateDistance();
    updateMonsterPosition();
    updateCarrotPosition();
    updateObstaclePosition();
    updateHeartPosition();

    if (myRole === 'wolf') {
      updateWolfMode(delta);
      updateBonePosition();
      checkCollision();
    } else if (myRole === 'rabbit') {
      checkCollision();
    }
  }

  render();
  requestAnimationFrame(loop);
}

function render() {
  renderer.render(scene, camera);
}

window.addEventListener('load', init, false);

function init(event) {
  initScreenAnd3D();
  createLights();
  createFloor()
  createHero();
  createMonster();
  createFirs();
  createCarrot();
  createBonusParticles();
  createObstacle();
  createWolfObstacle();
  createBone();
  createHeart();
  initUI();

  gameStatus = "waiting";

  var startBtn = document.getElementById("startButton");
  var multiBtn = document.getElementById("multiplayerButton");
  var startScreen = document.getElementById("startScreen");

  startBtn.addEventListener("click", function () {
    gameMode = "endless";
    startScreen.style.opacity = 0;
    setTimeout(function () {
      startScreen.style.display = "none";
      document.getElementById('roleSelection').style.display = 'flex';
      isMultiplayer = false;
      opponentRole = "cpu";
      setupRoleSelection();
    }, 500);
  });

  var timeAttackBtn = document.getElementById("timeAttackButton");
  if (timeAttackBtn) {
    timeAttackBtn.addEventListener("click", function () {
      gameMode = "timeAttack";
      startScreen.style.opacity = 0;
      setTimeout(function () {
        startScreen.style.display = "none";
        document.getElementById('roleSelection').style.display = 'flex';
        isMultiplayer = false;
        opponentRole = "cpu";
        setupRoleSelection();
      }, 500);
    });
  }

  multiBtn.addEventListener("click", function () {
    startScreen.style.opacity = 0;
    setTimeout(function () {
      startScreen.style.display = "none";
      document.getElementById('multiplayerMenu').style.display = 'flex';
      isMultiplayer = true;
    }, 500);
  });

  var backFromRoleBtn = document.getElementById("backFromRoleBtn");
  if (backFromRoleBtn) {
    backFromRoleBtn.addEventListener("click", function () {
      document.getElementById('roleSelection').style.display = 'none';
      startScreen.style.display = 'flex';
      startScreen.style.opacity = 1;
    });
  }

  var audioBtn = document.getElementById("audioButton");
  audioBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    audioMuted = !audioMuted;
    if (audioMuted) {
      audioBtn.innerHTML = "🔇";
      audioCtx.suspend();
    } else {
      audioBtn.innerHTML = "🔊";
      audioCtx.resume();
    }
  });

  // Prevent jumping when clicking audio button
  audioBtn.addEventListener("mousedown", function (e) {
    e.stopPropagation();
  });
  audioBtn.addEventListener("touchstart", function (e) {
    e.stopPropagation();
  });

  var saveBtn = document.getElementById("saveScoreButton");
  if (saveBtn) {
    saveBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var nameInput = document.getElementById("playerNameInput");
      var name = nameInput.value.trim().toUpperCase() || "ANÓNIMO";
      bestScore = window.pendingHighScore;
      bestName = name;
      localStorage.setItem("rabbitBestScore", bestScore);
      localStorage.setItem("rabbitBestName", bestName);

      var fieldBestDistance = document.getElementById("bestDistValue");
      var bestScoreContainer = document.getElementById("bestScoreContainer");
      var bestScoreLabel = document.getElementById("bestScoreLabel");
      if (fieldBestDistance) fieldBestDistance.innerHTML = bestScore;
      if (bestScoreLabel) bestScoreLabel.innerHTML = "Récord (" + bestName + ")";
      if (bestScoreContainer) bestScoreContainer.style.display = "block";

      document.getElementById("newHighScoreScreen").style.display = "none";
      gameStatus = "readyToReplay";
    });

    var nameInput = document.getElementById("playerNameInput");
    nameInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") saveBtn.click();
    });
  }

  document.getElementById("restartButton").addEventListener("click", function (e) {
    e.stopPropagation();
    replay();
  });

  setupWolfJumpControls(); // defined in wolfMode.js
  loop();
}

function resetGame() {
  scene.add(hero.mesh);
  hero.mesh.rotation.y = Math.PI / 2;
  hero.mesh.position.y = 0;
  hero.mesh.position.z = 0;
  hero.mesh.position.x = 0;

  if (gameMode === "timeAttack") {
    monsterPosTarget = 0.75; // Balanced lead for rabbit
    monsterAcceleration = 0.002;
  } else if (myRole === 'wolf') {
    monsterPosTarget = 0.62; // Intense chase (Wolf starts close)
    monsterAcceleration = 0.004;
  } else {
    monsterPosTarget = 0.65; // Standard solo/endless gap
    monsterAcceleration = 0.005; // Slightly more aggressive wolf
  }
  monsterPos = monsterPosTarget; // Prevent initial snap/retreat
  speed = initSpeed;
  level = 0;
  distance = 0;
  rabbitAI.reset();
  resetLives();
  if (!isMultiplayer) opponentDistance = 0;

  carrot.mesh.visible = true;
  obstacle.mesh.visible = true;
  if (heart) heart.mesh.visible = false;
  if (typeof bone !== 'undefined') bone.mesh.visible = false;

  gameStatus = "play";
  hero.status = "running";
  hero.nod();

  // Reset Day Theme
  var dayBg = "#dbe6e6";
  var dayLight = "#ffffff";
  TweenMax.to(document.getElementById("world"), 1, { backgroundColor: dayBg });
  var pBg = new THREE.Color(dayBg);
  TweenMax.to(scene.fog.color, 1, { r: pBg.r, g: pBg.g, b: pBg.b });
  var pL = new THREE.Color(dayLight);
  TweenMax.to(globalLight.color, 1, { r: pL.r, g: pL.g, b: pL.b });
  TweenMax.to(shadowLight.color, 1, { r: pL.r, g: pL.g, b: pL.b });

  startBGM();
  cinematicEntry();

  if (gameMode === "timeAttack") {
    timeRemaining = 45;
    document.getElementById('timerContainer').style.display = 'flex';
    updateTimerUI();
    startTimer();
  } else {
    document.getElementById('timerContainer').style.display = 'none';
    stopTimer();
  }

  updateLevel();

  if (myRole === 'wolf') {
    // Wolf jumps with click now
    document.addEventListener('mousedown', function () { if (gameStatus === "play") wolfJump(); });
    document.addEventListener('touchstart', function () { if (gameStatus === "play") wolfJump(); });
    // Remove old rabbit jump listeners if any
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('touchstart', handleMouseDown);

    showWolfHint();
  } else {
    // Rabbit controls
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleMouseDown);
    // Hide wolf hint if switching roles
    var hint = document.getElementById('wolfHint');
    if (hint) hint.style.display = 'none';
  }
}

// Wolf UI, wolf bite handlers, consumeObstacle, rabbitAI, onOpponentConsume
// → all moved to js/wolfMode.js



function createHeart() {
  heart = new LifeHeart();
  heart.mesh.visible = false;
  scene.add(heart.mesh);
}

function initUI() {
  fieldDistance = document.getElementById("distValue");
  fieldDistanceContainer = document.getElementById("dist");
  fieldGameOver = document.getElementById("gameoverInstructions");

  // Initialize centering with GSAP to prevent double-translation bugs
  TweenMax.set(fieldDistanceContainer, { xPercent: -50 });

  var fieldBestDistance = document.getElementById("bestDistValue");
  var bestScoreContainer = document.getElementById("bestScoreContainer");
  var bestScoreLabel = document.getElementById("bestScoreLabel");
  var savedScore = localStorage.getItem("rabbitBestScore");
  var savedName = localStorage.getItem("rabbitBestName") || "ANÓNIMO";
  if (savedScore) {
    bestScore = parseInt(savedScore, 10);
    bestName = savedName;
    if (fieldBestDistance) fieldBestDistance.innerHTML = bestScore;
    if (bestScoreLabel) bestScoreLabel.innerHTML = "Récord (" + bestName + ")";
    if (bestScoreContainer) bestScoreContainer.style.display = "block";
  }
}
