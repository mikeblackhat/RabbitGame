/**
 * Core Game Mechanics
 */

function updateDistance() {
  if (gameState.speed < gameConfig.maxSpeed) {
    gameState.speed += gameState.delta * 0.6;
  }

  gameState.distance += gameState.delta * gameState.speed;
  const d = gameState.distance / 1.5;
  fieldDistance.innerHTML = Math.floor(d);

  if (Math.floor(d) >= (gameState.level + 1) * 500) {
    updateLevel();
  }

  // Win condition at 10,000 meters
  if (Math.floor(d) >= 10000 && gameState.gameStatus === "play") {
    handleRabbitEscaped();
  }

  // Update Progress Bar / Race Line
  if (typeof updateRaceLine === 'function') {
    updateRaceLine();
  }

  if (isMultiplayer) {
    broadcastDistance(d);
  } else {
    gameState.opponentDistance += gameState.delta * (gameConfig.initSpeed + gameState.level * 2);
  }
}

function startTimer() {
  stopTimer();
  gameState.timerInterval = setInterval(() => {
    if (gameState.gameStatus === "play") {
      gameState.timeRemaining--;
      updateTimerUI();
      if (gameState.timeRemaining <= 0) {
        handleTimerEnd();
      }
    }
  }, 1000);
}

function handleTimerEnd() {
  const txt = document.getElementById('gameoverText');
  if (txt) {
    if (gameState.gameMode === "timeAttack") {
      txt.innerHTML = '¡LO LOGRASTE! 🏆 CONEJO GANADOR';
      txt.style.color = "#5f9042";
    } else {
      txt.innerHTML = '¡PERDISTE!';
      txt.style.color = "#bd3f4f";
    }
  }
  gameOver();
}

function stopTimer() {
  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
}

function updateLevel() {
  gameState.level++;

  // Alternate between Day and Night every level (100m)
  let newBg, newLightColor;
  if (gameState.level % 2 === 0) { // Night
    newBg = "#1a1a2e";
    newLightColor = "#4a4e69";
  } else { // Day
    newBg = "#dbe6e6";
    newLightColor = "#ffffff";
  }

  if (newBg) {
    applyThemeTransition(newBg, newLightColor);
  }
}

function applyThemeTransition(bg, light) {
  // Animate DOM Background
  TweenMax.to(document.getElementById("world"), 5, { backgroundColor: bg });
  
  // Animate 3D Fog
  const parsedColor = new THREE.Color(bg);
  TweenMax.to(scene.fog.color, 5, { r: parsedColor.r, g: parsedColor.g, b: parsedColor.b });
  
  // Animate Lights
  const parsedLight = new THREE.Color(light);
  TweenMax.to(globalLight.color, 5, { r: parsedLight.r, g: parsedLight.g, b: parsedLight.b });
  TweenMax.to(shadowLight.color, 5, { r: parsedLight.r, g: parsedLight.g, b: parsedLight.b });
}
