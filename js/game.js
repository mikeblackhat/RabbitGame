/**
 * game.js
 * Handles game state, distance tracking and timer logic
 */

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
    opponentDistance += delta * (initSpeed + level * 2);
    // Update progress bar UI
    updateRaceProgress(d, opponentDistance);
  }
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(function () {
    if (gameStatus === "play") {
      timeRemaining--;
      updateTimerUI();
      if (timeRemaining <= 0) {
        var txt = document.getElementById('gameoverText');
        if (txt) {
          if (gameMode === "timeAttack") {
            txt.innerHTML = '!PERDISTE! EL CONEJO ESCAPÓ';
            txt.style.color = "#5f9042";
          } else {
            txt.innerHTML = '¡TIEMPO AGOTADO! ⏱️';
          }
        }
        gameOver();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function updateTimerUI() {
  var m = Math.floor(timeRemaining / 60);
  var s = timeRemaining % 60;
  document.getElementById('timerValue').innerHTML = (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
}
