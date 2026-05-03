/**
 * collisions.js
 * Handles hit detection and interaction results
 */

function checkCollision() {
  // Rabbit collisions
  var db_rabbit = hero.mesh.position.clone().sub(carrot.mesh.position.clone());
  var dm_rabbit = hero.mesh.position.clone().sub(obstacle.mesh.position.clone());

  if (db_rabbit.length() < gameState.collisionBonus) {
    getBonus();
  }

  var dh_rabbit = hero.mesh.position.clone().sub(heart.mesh.position.clone());
  if (dh_rabbit.length() < gameState.collisionBonus && heart.mesh.visible) {
    getHeartBonus();
  }

  if (dm_rabbit.length() < gameState.collisionObstacle && obstacle.status != "flying") {
    getMalus();
  }

  // Wolf collisions
  if (myRole === 'wolf') {
    var db_wolf = monster.mesh.position.clone().sub(bone.mesh.position.clone());
    var dm_wolf = monster.mesh.position.clone().sub(obstacle.mesh.position.clone());

    if (db_wolf.length() < gameState.collisionBonus && (typeof bone !== 'undefined' && bone.mesh.visible)) {
      getWolfBonus();
    }

    if (dm_wolf.length() < gameState.collisionObstacle && obstacle.status != "flying") {
      var jumpBoost = (typeof wolfJumpOff !== 'undefined') ? wolfJumpOff.v : 0;
      if (jumpBoost < 5) { // Not high enough in jump
        getWolfMalus();
      }
    }
  }
}

function getBonus() {
  bonusParticles.mesh.position.copy(carrot.mesh.position);
  bonusParticles.mesh.visible = true;
  bonusParticles.explose();
  carrot.angle += Math.PI / 2;
  
  TweenMax.fromTo(fieldDistanceContainer, 0.3, { scale: 1 }, { scale: 1.2, yoyo: true, repeat: 1 });

  if (gameState.gameMode === "timeAttack") {
    gameState.timeRemaining += 5;
    updateTimerUI();
    _wolfPopup('wolfEatEl', '🥕 +5 SEG', '#5f9042');
  } else {
    gameState.monsterPosTarget += .025;
  }
  playBonusSound();
}

function getWolfBonus() {
  bone.mesh.visible = false;
  if (gameState.gameMode === "timeAttack") {
    gameState.timeRemaining += 5;
    updateTimerUI();
  } else {
    gameState.monsterPosTarget -= .025; 
  }
  playBonusSound();
  _wolfPopup('wolfEatEl', '🦴 ¡HUESO! +VEL');
}

function getMalus() {
  obstacle.status = "flying";
  var tx = (Math.random() > .5) ? -20 - Math.random() * 10 : 20 + Math.random() * 5;
  TweenMax.to(obstacle.mesh.position, 4, { x: tx, y: Math.random() * 50, z: 350, ease: Power4.easeOut });
  TweenMax.to(obstacle.mesh.rotation, 4, {
    x: Math.PI * 3, y: Math.PI * 6, z: Math.PI * 3, ease: Power4.easeOut,
    onComplete: resetObstacle
  });

  if (gameState.gameMode === "endless") {
    gameState.monsterPosTarget -= .04;
  } else {
    var txt = document.getElementById('gameoverText');
    if (txt) txt.innerHTML = '¡CHOCASTE! 💥';
    gameOver();
    return;
  }
  
  TweenMax.from(gameState, .5, {
    malusClearAlpha: .5, onUpdate: function () {
      renderer.setClearColor(gameConfig.malusClearColor, gameState.malusClearAlpha);
    }
  });
  playMalusSound();
  if (!isMultiplayer) onRabbitHit();
}

function getWolfMalus() {
  obstacle.status = "flying";
  var tx = (Math.random() > .5) ? -20 - Math.random() * 10 : 20 + Math.random() * 5;
  TweenMax.to(obstacle.mesh.position, 4, { x: tx, y: Math.random() * 50, z: 350, ease: Power4.easeOut });
  TweenMax.to(obstacle.mesh.rotation, 4, {
    x: Math.PI * 3, y: Math.PI * 6, z: Math.PI * 3, ease: Power4.easeOut,
    onComplete: resetObstacle
  });

  if (gameState.gameMode === "endless") {
    gameState.monsterPosTarget += .04;
  } else {
    gameState.timeRemaining -= 3;
    updateTimerUI();
  }
  onWolfHit();
  playMalusSound();
}

function getHeartBonus() {
  heart.mesh.visible = false;
  healRabbit();
  playBonusSound();
  _wolfPopup('heartPopup', '❤️ +1 VIDA', '#e91e63');
}

function resetObstacle() {
  obstacle.status = "ready";
  obstacle.body.rotation.y = Math.random() * Math.PI * 2;
  obstacle.angle = -gameState.floorRotation - Math.random() * .4;
  obstacle.angle = obstacle.angle % (Math.PI * 2);
  obstacle.mesh.rotation.set(0, 0, 0);
  obstacle.mesh.position.z = 0;
}
