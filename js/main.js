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
var initSpeed = 5;
var maxSpeed = 48;
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


function updateMonsterPosition() {
  monster.run();
  monsterPosTarget -= delta * monsterAcceleration;
  monsterPos += (monsterPosTarget - monsterPos) * delta;
  if (monsterPos < .56) {
    gameOver();
  }

  var angle = Math.PI * monsterPos;
  monster.mesh.position.y = - floorRadius + Math.sin(angle) * (floorRadius + 12);
  monster.mesh.position.x = Math.cos(angle) * (floorRadius + 15);
  monster.mesh.rotation.z = -Math.PI / 2 + angle;
}

var bestScore = 0;
var bestName = "";

function gameOver() {
  fieldGameOver.className = "show";
  var overlay = document.getElementById("gameOverOverlay");
  if (overlay) overlay.className = "show";
  
  var d = Math.floor(distance / 2);

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
    gameStatus = "gameOver";
  }
  monster.sit();
  hero.hang();
  monster.heroHolder.add(hero.mesh);
  TweenMax.to(this, 1, { speed: 0 });

  TweenMax.to(camera.position, 3, { z: cameraPosGameOver, y: 60, x: -30 });
  
  // Animate the distance score to center above game over text
  TweenMax.to(fieldDistanceContainer, 1, { top: "35%", scale: 1.5, xPercent: -50, ease: Back.easeOut });

  carrot.mesh.visible = false;
  obstacle.mesh.visible = false;
  stopBGM();
  playGameOverSound();

  if (isMultiplayer) {
    sendData({ type: 'gameOver', distance: d });
  }
}

function replay() {

  gameStatus = "preparingToReplay"

  fieldGameOver.className = "";
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

  TweenMax.to(camera.position, 3, { z: cameraPosGame, x: 0, y: 30, ease: Power4.easeInOut });
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

function updateObstaclePosition() {
  if (obstacle.status == "flying") return;

  // TODO fix this,
  if (floorRotation + obstacle.angle > 2.5) {
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

function checkCollision() {
  var db = hero.mesh.position.clone().sub(carrot.mesh.position.clone());
  var dm = hero.mesh.position.clone().sub(obstacle.mesh.position.clone());

  if (db.length() < collisionBonus) {
    getBonus();
  }

  if (dm.length() < collisionObstacle && obstacle.status != "flying") {
    getMalus();
  }
}

function getBonus() {
  bonusParticles.mesh.position.copy(carrot.mesh.position);
  bonusParticles.mesh.visible = true;
  bonusParticles.explose();
  carrot.angle += Math.PI / 2;
  //speed*=.95;
  monsterPosTarget += .025;
  playBonusSound();
}

function getMalus() {
  obstacle.status = "flying";
  var tx = (Math.random() > .5) ? -20 - Math.random() * 10 : 20 + Math.random() * 5;
  TweenMax.to(obstacle.mesh.position, 4, { x: tx, y: Math.random() * 50, z: 350, ease: Power4.easeOut });
  TweenMax.to(obstacle.mesh.rotation, 4, {
    x: Math.PI * 3, z: Math.PI * 3, y: Math.PI * 6, ease: Power4.easeOut, onComplete: function () {
      obstacle.status = "ready";
      obstacle.body.rotation.y = Math.random() * Math.PI * 2;
      obstacle.angle = -floorRotation - Math.random() * .4;

      obstacle.angle = obstacle.angle % (Math.PI * 2);
      obstacle.mesh.rotation.x = 0;
      obstacle.mesh.rotation.y = 0;
      obstacle.mesh.rotation.z = 0;
      obstacle.mesh.position.z = 0;

    }
  });
  //
  monsterPosTarget -= .04;
  TweenMax.from(this, .5, {
    malusClearAlpha: .5, onUpdate: function () {
      renderer.setClearColor(malusClearColor, malusClearAlpha);
    }
  });
  playMalusSound();
}

function updateDistance() {
  // Continuously accelerate the game
  if (speed < maxSpeed) {
    speed += delta * 0.8; 
  }
  
  distance += delta * speed;
  var d = distance / 2;
  fieldDistance.innerHTML = Math.floor(d);
  
  // Update visual environment every 1000 meters
  if (Math.floor(d) >= level * 1000) {
    updateLevel();
  }

  // MULTIPLAYER / CPU SYNC
  if (isMultiplayer) {
    broadcastDistance(d);
  } else {
    // CPU Progress in Solo Mode
    // CPU speed could be slightly varied or fixed
    opponentDistance += delta * (initSpeed + level * 2); 
  }
  
  updateRaceLine();
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

    if (myRole === 'wolf') {
      updateWolfMode(delta);   // rabbit AI + wolf bite cooldown (wolfMode.js)
      checkCollision();        // AI rabbit collects carrots / hits hedgehogs
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
  initUI();

  gameStatus = "waiting";

  var startBtn = document.getElementById("startButton");
  var multiBtn = document.getElementById("multiplayerButton");
  var startScreen = document.getElementById("startScreen");

  startBtn.addEventListener("click", function () {
    startScreen.style.opacity = 0;
    setTimeout(function () {
      startScreen.style.display = "none";
      // Show role selection for Solo mode too
      document.getElementById('roleSelection').style.display = 'flex';
      isMultiplayer = false;
      opponentRole = "cpu"; 
      setupRoleSelection();
    }, 500);
  });

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
    saveBtn.addEventListener("click", function(e) {
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
    nameInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") saveBtn.click();
    });
  }

  loop();
}

function resetGame() {
  scene.add(hero.mesh);
  hero.mesh.rotation.y = Math.PI / 2;
  hero.mesh.position.y = 0;
  hero.mesh.position.z = 0;
  hero.mesh.position.x = 0;

  monsterPos = .56;
  monsterPosTarget = .65;
  speed = initSpeed;
  level = 0;
  distance = 0;
  rabbitAI.reset();          // defined in wolfMode.js
  wolfBiteCooldown = 0;      // defined in wolfMode.js
  if (!isMultiplayer) opponentDistance = 0;
  
  carrot.mesh.visible = true;
  obstacle.mesh.visible = true;
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
  updateLevel();
  
  if (myRole === 'wolf') {
    // Wolf cannot jump — remove rabbit controls
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('touchstart', handleMouseDown);
    // Wolf uses raycasting to click obstacles
    document.addEventListener('mousedown', handleWolfClick);
    document.addEventListener('touchstart', handleWolfTouchClick);
    // Show wolf-mode hint
    showWolfHint();
  } else {
    // Rabbit controls
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleMouseDown);
    document.removeEventListener('mousedown', handleWolfClick);
    document.removeEventListener('touchstart', handleWolfTouchClick);
    // Hide wolf hint if switching roles
    var hint = document.getElementById('wolfHint');
    if (hint) hint.style.display = 'none';
  }
}

// Wolf UI, wolf bite handlers, consumeObstacle, rabbitAI, onOpponentConsume
// → all moved to js/wolfMode.js


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
