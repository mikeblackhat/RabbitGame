/**
 * collisions.js
 * Handles hit detection and interaction results
 */

function checkCollision() {
  // Rabbit collisions
  if (myRole === 'rabbit' || !isMultiplayer) {
    var db_rabbit = hero.mesh.position.clone().sub(carrot.mesh.position.clone());
    var dm_rabbit = hero.mesh.position.clone().sub(obstacle.mesh.position.clone());

    if (db_rabbit.length() < gameState.collisionBonus && carrot.mesh.visible) {
      getBonus();
    }

    var dh_rabbit = hero.mesh.position.clone().sub(heart.mesh.position.clone());
    if (dh_rabbit.length() < gameState.collisionBonus && heart && heart.mesh.visible) {
      getHeartBonus();
    }

    if (dm_rabbit.length() < gameState.collisionObstacle && obstacle.status != "flying") {
      getMalus();
    }
  }

  // Wolf collisions (Bones and Heart only - Obstacles don't affect Wolf)
  if (myRole === 'wolf' || !isMultiplayer) {
    var db_wolf = monster.mesh.position.clone().sub(bone.mesh.position.clone());

    if (db_wolf.length() < gameState.collisionBonus && bone && bone.mesh.visible) {
      getWolfBonus();
    }
  }
}

function getBonus() {
  bonusParticles.mesh.position.copy(carrot.mesh.position);
  bonusParticles.mesh.visible = true;
  bonusParticles.explose();
  carrot.angle += Math.PI / 3 + Math.random() * Math.PI; // Random jump instead of fixed 90deg
  
  TweenMax.fromTo(fieldDistanceContainer, 0.3, { scale: 1 }, { scale: 1.2, yoyo: true, repeat: 1 });

  if (gameState.gameMode === "timeAttack") {
    gameState.timeRemaining += 5;
    updateTimerUI();
    _wolfPopup('bonusPopup', '🥕 +5 SEG', '#5f9042');
  } else {
    const d = gameState.distance / 1.5;
    let distScaling = 1;
    if (d > 1000) {
      distScaling = 1 + (d - 1000) / 2000; // Bonus increases progressively after 1000m
    }

    const isLucky = Math.random() > 0.4; // Slightly more common but less extreme
    const bonusValue = (isLucky ? .05 : .02) * distScaling;
    gameState.proximityTarget += bonusValue;
    
    let msg = isLucky ? '🌟 ¡SUPER ZANAHORIA!' : '🥕 CONEJO: +DISTANCIA';
    if (distScaling > 1.1) msg += ' (VETERANO)';
    _wolfPopup('bonusPopup', msg, '#5f9042');
  }
  playBonusSound();
}

function getWolfBonus() {
  bone.mesh.visible = false;
  if (gameState.gameMode === "timeAttack") {
    gameState.timeRemaining += 5;
    updateTimerUI();
    _wolfPopup('bonusPopup', '🦴 LOBO: +5 SEG', '#2575fc');
  } else {
    gameState.proximityTarget -= .02; // Reduced bone power for longer play
    _wolfPopup('bonusPopup', '🦴 LOBO: +VELOCIDAD', '#dc5f45');
  }
  playBonusSound();
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
    gameState.proximityTarget -= .06; // Reduced from .12 for better balance
    _wolfPopup('malusPopup', '💥 ¡EL LOBO SE ACERCA!', '#dc5f45');
  } else {
    var txt = document.getElementById('gameoverText');
    if (txt) txt.innerHTML = '¡CHOCASTE! 💥';
    _wolfPopup('malusPopup', '💥 ¡GOLPE!', '#dc5f45');
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
  // Wolf is immune to obstacles
}

function getHeartBonus() {
  heart.mesh.visible = false;
  healRabbit();
  playBonusSound();
  _wolfPopup('bonusPopup', '❤️ +1 VIDA', '#e91e63');
}

function resetObstacle() {
  obstacle.status = "ready";
  obstacle.body.rotation.y = Math.random() * Math.PI * 2;
  // Wide range of randomness for re-entry
  obstacle.angle = -gameState.floorRotation - 0.5 - Math.random() * 1.5;
  obstacle.angle = obstacle.angle % (Math.PI * 2);
  obstacle.mesh.rotation.set(0, 0, 0);
  obstacle.mesh.position.z = 0;
}
