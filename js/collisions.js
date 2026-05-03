/**
 * collisions.js
 * Handles hit detection and interaction results
 */

function checkCollision() {
  // Rabbit collisions (Always check, whether player is rabbit or AI)
  var db_rabbit = hero.mesh.position.clone().sub(carrot.mesh.position.clone());
  var dm_rabbit = hero.mesh.position.clone().sub(obstacle.mesh.position.clone());

  if (db_rabbit.length() < collisionBonus) {
    getBonus();
  }

  if (dm_rabbit.length() < collisionObstacle && obstacle.status != "flying") {
    getMalus();
  }

  // Wolf collisions (Only if player is wolf)
  if (myRole === 'wolf') {
    var db_wolf = monster.mesh.position.clone().sub(bone.mesh.position.clone());
    var dm_wolf = monster.mesh.position.clone().sub(obstacle.mesh.position.clone());

    if (db_wolf.length() < collisionBonus && (typeof bone !== 'undefined' && bone.mesh.visible)) {
      getWolfBonus();
    }

    if (dm_wolf.length() < collisionObstacle && obstacle.status != "flying") {
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

  if (gameMode === "timeAttack") {
    timeRemaining += 5;
    updateTimerUI();
    _wolfPopup('wolfEatEl', '🥕 +5 SEG', '#5f9042');
  } else {
    monsterPosTarget += .025;
  }
  playBonusSound();
}

function getWolfBonus() {
  bone.mesh.visible = false;
  if (gameMode === "timeAttack") {
    timeRemaining += 5;
    updateTimerUI();
  } else {
    monsterPosTarget -= .025; 
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

  if (gameMode === "endless") {
    monsterPosTarget -= .04;
  } else {
    var txt = document.getElementById('gameoverText');
    if (txt) txt.innerHTML = '¡CHOCASTE! 💥';
    gameOver();
    return;
  }
  
  TweenMax.from(this, .5, {
    malusClearAlpha: .5, onUpdate: function () {
      renderer.setClearColor(malusClearColor, malusClearAlpha);
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

  if (gameMode === "endless") {
    monsterPosTarget += .04;
  } else {
    timeRemaining -= 3;
    updateTimerUI();
  }
  onWolfHit();
  playMalusSound();
}

function resetObstacle() {
  obstacle.status = "ready";
  obstacle.body.rotation.y = Math.random() * Math.PI * 2;
  obstacle.angle = -floorRotation - Math.random() * .4;
  obstacle.angle = obstacle.angle % (Math.PI * 2);
  obstacle.mesh.rotation.set(0, 0, 0);
  obstacle.mesh.position.z = 0;
}
