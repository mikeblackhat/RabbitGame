/**
 * Game Flow Manager - Handles game state transitions
 */

function gameOver() {
  const d = Math.floor(gameState.distance / 2);
  let winner = 'wolf';

  const txt = document.getElementById('gameoverText');
  if (txt) {
    if (txt.innerHTML.includes('CONEJO GANADOR') || txt.innerHTML.includes('ESCPA')) {
      winner = 'rabbit';
    }
  }

  showGameOverUI(winner, d);
  playEndGameAnimation(winner);

  if (isMultiplayer) {
    sendData({ type: 'gameOver', distance: d });
  }
}

function replay() {
  gameState.gameStatus = "preparingToReplay";

  fieldGameOver.className = "";
  const txt = document.getElementById('gameoverText');
  if (txt) txt.innerHTML = "Fin del juego";
  
  const overlay = document.getElementById("gameOverOverlay");
  if (overlay) overlay.className = "";

  // UI Reset
  TweenMax.to(fieldDistanceContainer, 1, { top: "5%", scale: 1, xPercent: -50, ease: Power4.easeInOut });

  // Kill Tweens
  killMonsterTweens();

  monster.tail.rotation.y = 0;

  // Animations
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
    x: .4, ease: Power4.easeIn, delay: 1, onComplete: () => {
      resetGame();
    }
  });
}

function resetGame() {
  // Reset hero holder (central focus)
  heroHolder.position.set(0, 0, 0);
  heroHolder.rotation.set(0, 0, 0);

  // Set proximity (distance between characters) based on selected role
  if (myRole === 'wolf') {
    // Wolf is central, rabbit ahead
    gameState.proximity = 0.15; // initial gap
  } else {
    // Rabbit is central, wolf behind
    gameState.proximity = 0.15;
  }
  gameState.proximityTarget = gameState.proximity;

  // Reset other state variables
  gameState.speed = gameConfig.initSpeed;
  gameState.level = 0;
  gameState.distance = 0;

  rabbitAI.reset();
  resetLives();
  if (!isMultiplayer) gameState.opponentDistance = 0;

  carrot.mesh.visible = true;
  obstacle.mesh.visible = true;
  if (heart) heart.mesh.visible = false;
  if (typeof bone !== 'undefined') bone.mesh.visible = false;

  gameState.gameStatus = "play";
  hero.status = "running";
  hero.nod();

  // Reset Day Theme
  const dayBg = "#dbe6e6";
  const dayLight = "#ffffff";
  TweenMax.to(document.getElementById("world"), 1, { backgroundColor: dayBg });
  const pBg = new THREE.Color(dayBg);
  TweenMax.to(scene.fog.color, 1, { r: pBg.r, g: pBg.g, b: pBg.b });
  const pL = new THREE.Color(dayLight);
  TweenMax.to(globalLight.color, 1, { r: pL.r, g: pL.g, b: pL.b });
  TweenMax.to(shadowLight.color, 1, { r: pL.r, g: pL.g, b: pL.b });

  startBGM();
  cinematicEntry();

  if (gameState.gameMode === "timeAttack") {
    gameState.timeRemaining = 45;
    document.getElementById('timerContainer').style.display = 'flex';
    updateTimerUI();
    startTimer();
  } else {
    document.getElementById('timerContainer').style.display = 'none';
    stopTimer();
  }

  updateLevel();
  setupRoleControls();
  showGameInstructions(myRole);
}

function setupRoleControls() {
  if (myRole === 'wolf') {
    showWolfHint();
  } else {
    const hint = document.getElementById('wolfHint');
    if (hint) hint.style.display = 'none';
  }
}


function killMonsterTweens() {
  const parts = [
    monster.pawFL.position, monster.pawFR.position, monster.pawBL.position, monster.pawBR.position,
    monster.pawFL.rotation, monster.pawFR.rotation, monster.pawBL.rotation, monster.pawBR.rotation,
    monster.tail.rotation, monster.head.rotation, monster.eyeL.scale, monster.eyeR.scale
  ];
  parts.forEach(p => TweenMax.killTweensOf(p));
}
