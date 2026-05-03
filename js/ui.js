/**
 * UI Manager for menus, overlays and HUD updates
 */

function initUI() {
  fieldDistance = document.getElementById("distValue");
  fieldDistanceContainer = document.getElementById("dist");
  fieldGameOver = document.getElementById("gameoverInstructions");

  // Initialize centering with GSAP
  TweenMax.set(fieldDistanceContainer, { xPercent: -50 });

  const fieldBestDistance = document.getElementById("bestDistValue");
  const bestScoreContainer = document.getElementById("bestScoreContainer");
  const bestScoreLabel = document.getElementById("bestScoreLabel");
  const savedScore = localStorage.getItem("rabbitBestScore");
  const savedName = localStorage.getItem("rabbitBestName") || "ANÓNIMO";
  
  if (savedScore) {
    gameState.bestScore = parseInt(savedScore, 10);
    gameState.bestName = savedName;
    if (fieldBestDistance) fieldBestDistance.innerHTML = gameState.bestScore;
    if (bestScoreLabel) bestScoreLabel.innerHTML = "Récord (" + gameState.bestName + ")";
    if (bestScoreContainer) bestScoreContainer.style.display = "block";
  }

  setupMenuListeners();
}

function setupMenuListeners() {
  const startBtn = document.getElementById("startButton");
  const multiBtn = document.getElementById("multiplayerButton");
  const startScreen = document.getElementById("startScreen");
  const timeAttackBtn = document.getElementById("timeAttackButton");
  const backFromRoleBtn = document.getElementById("backFromRoleBtn");
  const audioBtn = document.getElementById("audioButton");
  const saveBtn = document.getElementById("saveScoreButton");
  const restartBtn = document.getElementById("restartButton");

  startBtn.addEventListener('click', () => {
    gameState.gameMode = "endless";
    isMultiplayer = false;
    opponentRole = "cpu";
    myRole = "rabbit"; // default role for solo play
    hideStartScreen();
    // Directly start the game without role selection UI
    resetGame();
  });

  if (timeAttackBtn) {
    timeAttackBtn.addEventListener('click', () => {
      gameState.gameMode = "timeAttack";
      isMultiplayer = false;
      myRole = "rabbit";
      hideStartScreen();
      resetGame();
    });
  }

  multiBtn.addEventListener("click", () => {
    hideStartScreen();
    document.getElementById('multiplayerMenu').style.display = 'flex';
    isMultiplayer = true;
  });

  if (backFromRoleBtn) {
    backFromRoleBtn.addEventListener("click", () => {
      document.getElementById('roleSelection').style.display = 'none';
      startScreen.style.display = 'flex';
      startScreen.style.opacity = 1;
    });
  }

  audioBtn.addEventListener("click", (e) => {
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

  if (saveBtn) {
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nameInput = document.getElementById("playerNameInput");
      const name = nameInput.value.trim().toUpperCase() || "ANÓNIMO";
      gameState.bestScore = window.pendingHighScore;
      gameState.bestName = name;
      localStorage.setItem("rabbitBestScore", gameState.bestScore);
      localStorage.setItem("rabbitBestName", gameState.bestName);

      const fieldBestDistance = document.getElementById("bestDistValue");
      const bestScoreContainer = document.getElementById("bestScoreContainer");
      const bestScoreLabel = document.getElementById("bestScoreLabel");
      if (fieldBestDistance) fieldBestDistance.innerHTML = gameState.bestScore;
      if (bestScoreLabel) bestScoreLabel.innerHTML = "Récord (" + gameState.bestName + ")";
      if (bestScoreContainer) bestScoreContainer.style.display = "block";

      document.getElementById("newHighScoreScreen").style.display = "none";
      gameState.gameStatus = "readyToReplay";
    });

    const nameInput = document.getElementById("playerNameInput");
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveBtn.click();
    });
  }

  restartBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    replay();
  });
}

function hideStartScreen() {
  const startScreen = document.getElementById("startScreen");
  startScreen.style.opacity = 0;
  setTimeout(() => {
    startScreen.style.display = "none";
  }, 500);
}

function showRoleSelection() {
  document.getElementById('roleSelection').style.display = 'flex';
}

function updateTimerUI() {
  const m = Math.floor(gameState.timeRemaining / 60);
  const s = gameState.timeRemaining % 60;
  document.getElementById('timerValue').innerHTML = (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
}

function showGameInstructions(role) {
  const instr = document.getElementById("instructions");
  if (!instr) return;

  if (role === 'wolf') {
    instr.innerHTML = 'Haz click para morder / saltar <span class="lightInstructions">Toma los huesos / evita los erizos</span>';
  } else {
    instr.innerHTML = 'Haz click para saltar <span class="lightInstructions">Toma las zanahorias / evita los erizos</span>';
  }

  instr.style.display = 'block';
  instr.style.opacity = '1';

  // Hide after 5 seconds
  setTimeout(() => {
    TweenMax.to(instr, 1, { 
      opacity: 0, 
      onComplete: () => { instr.style.display = 'none'; } 
    });
  }, 5000);
}

function showGameOverUI(winner, distance) {
  // Hide instructions if they were still visible
  const instr = document.getElementById("instructions");
  if (instr) instr.style.display = 'none';

  if (distance > gameState.bestScore) {
    gameState.gameStatus = "enteringName";
    document.getElementById("newHighScoreScreen").style.display = "flex";
    const nameInput = document.getElementById("playerNameInput");
    if (nameInput) {
      nameInput.value = "";
      nameInput.focus();
    }
    window.pendingHighScore = distance;
  } else {
    gameState.gameStatus = "readyToReplay";
  }
}
