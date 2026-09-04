/**
 * MULTIPLAYER MODULE - Competitive Online P2P (PeerJS WebRTC)
 * Real-time synchronization for Rabbit vs Wolf competitive gameplay
 */

var peer = null;
var conn = null;
var isHost = false;
var myPeerId = "";
var opponentRole = "";
var gameReady = false;
var lastHostSyncTime = 0;
var rematchRequestedByMe = false;
var rematchRequestedByOpponent = false;

// Generate clean 6-character room code (e.g. RAB-492)
function generateRoomCode() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var code = "RAB-";
  for (var i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Initialize PeerJS network
 */
function initMultiplayer(autoJoinCode) {
  if (peer && !peer.destroyed) {
    if (autoJoinCode) {
      connectToRoom(autoJoinCode);
    }
    return;
  }

  var chosenId = generateRoomCode();
  
  try {
    peer = new Peer(chosenId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });
  } catch (err) {
    console.error("PeerJS init failed:", err);
    peer = new Peer(null, { debug: 1 });
  }

  peer.on('open', function(id) {
    myPeerId = id;
    console.log("PeerJS ready with ID:", id);
    var display = document.getElementById('peerIdDisplay');
    if (display) display.innerText = "Tu ID de red: " + id;

    // If URL has ?room=... auto-connect
    if (autoJoinCode) {
      connectToRoom(autoJoinCode);
    }
  });

  peer.on('connection', function(c) {
    if (conn && conn.open) {
      c.close();
      return;
    }
    conn = c;
    isHost = true;
    setupConnection();
  });

  peer.on('error', function(err) {
    console.warn("PeerJS error:", err.type, err);
    if (err.type === 'unavailable-id') {
      // Retry with another random ID
      peer = new Peer(generateRoomCode(), { debug: 1 });
    } else if (err.type === 'peer-unavailable') {
      alert("No se encontró la sala especificada. Verifica el código e intenta de nuevo.");
      showMenu('multiplayerMenu');
    }
  });

  setupMultiplayerUI();
}

/**
 * Connect to a room by room code
 */
function connectToRoom(id) {
  if (!id) return;
  id = id.trim().toUpperCase();

  if (!peer || peer.destroyed) {
    initMultiplayer(id);
    return;
  }

  var waitingRoom = document.getElementById('waitingRoom');
  if (waitingRoom) {
    waitingRoom.style.display = 'flex';
    var codeEl = document.getElementById('currentRoomCode');
    if (codeEl) codeEl.innerText = id;
    var hint = waitingRoom.querySelector('.waiting-hint');
    if (hint) hint.innerText = "Conectando con la sala " + id + "...";
  }

  conn = peer.connect(id, { reliable: true });
  isHost = false;
  setupConnection();
}

/**
 * Configure active peer connection
 */
function setupConnection() {
  if (!conn) return;

  conn.on('open', function() {
    console.log("Conectado con el oponente!");
    isMultiplayer = true;
    gameState.gameMode = "competitive";

    document.getElementById('multiplayerMenu').style.display = 'none';
    document.getElementById('waitingRoom').style.display = 'none';
    document.getElementById('startScreen').style.display = 'none';

    showRoleSelection();
    setupRoleSelection();
  });

  conn.on('data', function(data) {
    handleIncomingData(data);
  });

  conn.on('close', function() {
    console.log("El oponente se ha desconectado");
    alert("El oponente se ha desconectado de la partida.");
    location.href = window.location.pathname;
  });
}

/**
 * Send data packet over WebRTC connection
 */
function sendData(data) {
  if (conn && conn.open) {
    conn.send(data);
  }
}

/**
 * Setup UI bindings
 */
function setupMultiplayerUI() {
  var multiBtn = document.getElementById('multiplayerButton');
  var multiMenu = document.getElementById('multiplayerMenu');
  var backBtn = document.getElementById('backToMenuBtn');
  var createBtn = document.getElementById('createRoomBtn');
  var joinBtn = document.getElementById('joinRoomBtn');
  var quickMatchBtn = document.getElementById('quickMatchBtn');
  var roomInput = document.getElementById('roomCodeInput');
  var waitingRoom = document.getElementById('waitingRoom');
  var cancelWaiting = document.getElementById('cancelWaitingBtn');
  var copyCodeBtn = document.getElementById('copyRoomCodeBtn');
  var copyLinkBtn = document.getElementById('copyRoomLinkBtn');
  var rematchBtn = document.getElementById('rematchButton');

  if (multiBtn) {
    multiBtn.onclick = function() {
      document.getElementById('startScreen').style.display = 'none';
      multiMenu.style.display = 'flex';
      if (!peer) initMultiplayer();
    };
  }

  if (backBtn) {
    backBtn.onclick = function() {
      multiMenu.style.display = 'none';
      document.getElementById('startScreen').style.display = 'flex';
    };
  }

  if (createBtn) {
    createBtn.onclick = function() {
      multiMenu.style.display = 'none';
      waitingRoom.style.display = 'flex';
      isHost = true;
      var codeEl = document.getElementById('currentRoomCode');
      if (codeEl) codeEl.innerText = myPeerId || "GENERANDO...";
      var hint = waitingRoom.querySelector('.waiting-hint');
      if (hint) hint.innerText = "Comparte el código o el enlace con tu amigo para iniciar el duelo.";
    };
  }

  if (joinBtn) {
    joinBtn.onclick = function() {
      var code = roomInput.value.trim().toUpperCase();
      if (code) {
        multiMenu.style.display = 'none';
        connectToRoom(code);
      } else {
        alert("Por favor ingresa un código de sala válido.");
      }
    };
  }

  if (quickMatchBtn) {
    quickMatchBtn.onclick = function() {
      var publicRoom = "RAB-PUB1";
      multiMenu.style.display = 'none';
      connectToRoom(publicRoom);
    };
  }

  if (cancelWaiting) {
    cancelWaiting.onclick = function() {
      if (conn) {
        conn.close();
        conn = null;
      }
      waitingRoom.style.display = 'none';
      multiMenu.style.display = 'flex';
    };
  }

  if (copyCodeBtn) {
    copyCodeBtn.onclick = function() {
      var code = document.getElementById('currentRoomCode').innerText;
      copyToClipboard(code, "¡Código copiado al portapapeles!");
    };
  }

  if (copyLinkBtn) {
    copyLinkBtn.onclick = function() {
      var code = document.getElementById('currentRoomCode').innerText;
      var cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      var inviteUrl = cleanUrl + '?room=' + encodeURIComponent(code);
      copyToClipboard(inviteUrl, "¡Enlace copiado! Pégalo en WhatsApp o Discord.");
    };
  }

  if (rematchBtn) {
    rematchBtn.onclick = function() {
      requestRematch();
    };
  }
}

/**
 * Safe clipboard copy with fallback
 */
function copyToClipboard(text, successMsg) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function() {
      showCopyToast(successMsg);
    }).catch(function() {
      fallbackCopy(text, successMsg);
    });
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  var temp = document.createElement("textarea");
  temp.value = text;
  document.body.appendChild(temp);
  temp.select();
  try {
    document.execCommand('copy');
    showCopyToast(successMsg);
  } catch (e) {
    prompt("Copia este texto manualmente:", text);
  }
  document.body.removeChild(temp);
}

function showCopyToast(msg) {
  var feedback = document.getElementById('copyFeedback');
  if (feedback) {
    feedback.innerText = msg;
    feedback.style.display = 'block';
    setTimeout(function() {
      feedback.style.display = 'none';
    }, 4000);
  }
}

/**
 * Handle role selection
 */
function setupRoleSelection() {
  var rabbitCard = document.getElementById('selectRabbit');
  var wolfCard = document.getElementById('selectWolf');
  var waitingMsg = document.getElementById('roleWaitingMsg');
  var countdown = document.getElementById('matchCountdown');

  if (countdown) countdown.style.display = 'none';
  if (waitingMsg) {
    waitingMsg.style.display = 'block';
    waitingMsg.innerText = isMultiplayer 
      ? "Esperando que ambos jugadores elijan bando..." 
      : "Elige tu bando para comenzar";
  }

  // Reset cards styles
  [rabbitCard, wolfCard].forEach(function(card) {
    if (card) {
      card.classList.remove('selected', 'disabled');
      var status = card.querySelector('.status-msg');
      if (status) status.innerText = "LISTO";
    }
  });

  rabbitCard.onclick = function() { chooseRole('rabbit'); };
  wolfCard.onclick = function() { chooseRole('wolf'); };
}

function chooseRole(role) {
  myRole = role;
  var rabbitCard = document.getElementById('selectRabbit');
  var wolfCard = document.getElementById('selectWolf');

  if (role === 'rabbit') {
    rabbitCard.classList.add('selected');
    wolfCard.classList.remove('selected');
    wolfCard.classList.add('disabled');
  } else {
    wolfCard.classList.add('selected');
    rabbitCard.classList.remove('selected');
    rabbitCard.classList.add('disabled');
  }

  if (isMultiplayer) {
    sendData({ type: 'roleChosen', role: role });
  }

  checkAllRolesChosen();
}

function checkAllRolesChosen() {
  if (myRole && (opponentRole || !isMultiplayer)) {
    if (isMultiplayer && myRole === opponentRole) {
      if (!isHost) {
        alert("El rival ya eligió ese bando. Por favor elige el otro.");
        var rabbitCard = document.getElementById('selectRabbit');
        var wolfCard = document.getElementById('selectWolf');
        rabbitCard.classList.remove('selected', 'disabled');
        wolfCard.classList.remove('selected', 'disabled');
        myRole = "";
        return;
      }
    }

    // Both chosen different roles -> Start Countdown!
    var countdownEl = document.getElementById('matchCountdown');
    var numEl = document.getElementById('countdownNumber');
    var waitingMsg = document.getElementById('roleWaitingMsg');
    
    if (waitingMsg) waitingMsg.style.display = 'none';
    if (countdownEl) countdownEl.style.display = 'block';

    var count = 3;
    if (numEl) numEl.innerText = count;

    var timer = setInterval(function() {
      count--;
      if (numEl) numEl.innerText = count;
      if (count <= 0) {
        clearInterval(timer);
        startMultiplayerMatch();
      }
    }, 1000);
  }
}

function startMultiplayerMatch() {
  var roleScreen = document.getElementById('roleSelection');
  var raceContainer = document.getElementById('raceContainer');
  if (roleScreen) roleScreen.style.display = 'none';
  if (raceContainer) raceContainer.style.display = 'block';

  updateRaceLabels();
  if (typeof resetGame === 'function') {
    resetGame();
  }
}

function updateRaceLabels() {
  var p1Marker = document.getElementById('p1Marker');
  var p2Marker = document.getElementById('p2Marker');

  if (myRole === 'rabbit') {
    if (p1Marker) {
      p1Marker.innerText = "🐰 TÚ (Conejo)";
      p1Marker.style.background = "#5f9042";
    }
    if (p2Marker) {
      p2Marker.innerText = "🐺 RIVAL (Lobo)";
      p2Marker.style.background = "#dc5f45";
    }
  } else {
    if (p1Marker) {
      p1Marker.innerText = "🐺 TÚ (Lobo)";
      p1Marker.style.background = "#dc5f45";
    }
    if (p2Marker) {
      p2Marker.innerText = "🐰 RIVAL (Conejo)";
      p2Marker.style.background = "#5f9042";
    }
  }
}

/**
 * Handle incoming WebRTC packets
 */
function handleIncomingData(data) {
  if (!data || !data.type) return;

  switch (data.type) {
    case 'roleChosen':
      opponentRole = data.role;
      var card = document.getElementById(data.role === 'rabbit' ? 'selectRabbit' : 'selectWolf');
      if (card) {
        var status = card.querySelector('.status-msg');
        if (status) status.innerText = "OCUPADO";
      }
      checkAllRolesChosen();
      break;

    case 'hostSync':
      if (!isHost) {
        // Authoritative sync from Host
        gameState.distance = data.distance;
        gameState.speed = data.speed;
        gameState.proximity = data.proximity;
        gameState.proximityTarget = data.proximity;
        gameState.level = data.level;
        rabbitHits = data.rabbitHits;
        wolfHits = data.wolfHits;
        updateLivesDisplay();
        updateRaceLine();
      }
      break;

    case 'jump':
      if (data.role === 'rabbit') {
        remoteRabbitJump();
      } else if (data.role === 'wolf') {
        remoteWolfJump();
      }
      break;

    case 'itemCollected':
      if (data.item === 'carrot') {
        if (carrot && carrot.mesh) {
          bonusParticles.mesh.position.copy(carrot.mesh.position);
          bonusParticles.mesh.visible = true;
          bonusParticles.explose();
          carrot.mesh.visible = false;
        }
        playBonusSound();
        _wolfPopup('bonusPopup', '🥕 CONEJO +DISTANCIA', '#5f9042');
      } else if (data.item === 'bone') {
        if (bone && bone.mesh) {
          bone.mesh.visible = false;
        }
        playBonusSound();
        _wolfPopup('bonusPopup', '🦴 LOBO +VELOCIDAD', '#dc5f45');
      } else if (data.item === 'heart') {
        if (heart && heart.mesh) {
          heart.mesh.visible = false;
        }
        healRabbit();
        playBonusSound();
      }
      break;

    case 'rabbitHit':
      onRabbitHit();
      break;

    case 'spawnItem':
      if (data.item === 'bone' && bone) {
        bone.mesh.visible = true;
        bone.angle = data.angle;
      } else if (data.item === 'heart' && heart) {
        heart.mesh.visible = true;
        heart.angle = data.angle;
      }
      break;

    case 'competitiveGameOver':
      handleCompetitiveGameOver(data.winner, data.reason);
      break;

    case 'rematch':
      rematchRequestedByOpponent = true;
      var rematchBtn = document.getElementById('rematchButton');
      if (rematchBtn) {
        rematchBtn.innerText = "⚔️ ¡Aceptar Revancha!";
        rematchBtn.style.animation = "pulse 1s infinite";
      }
      if (rematchRequestedByMe) {
        // Both agreed!
        executeRematch();
      }
      break;

    case 'startRematch':
      executeRematch();
      break;
  }
}

/**
 * Remote Visual Actions (No local duplication of collision logic)
 */
function remoteRabbitJump() {
  if (hero && hero.status !== "jumping") {
    hero.jump();
  }
}

function remoteWolfJump() {
  if (typeof wolfJump === 'function' && !wolfIsJumping) {
    wolfJump();
  }
}

/**
 * Sync jump over network
 */
function syncMultiplayerJump(role) {
  if (isMultiplayer) {
    sendData({ type: 'jump', role: role });
  }
}

/**
 * Sync collected items over network
 */
function syncMultiplayerItem(itemType, role) {
  if (isMultiplayer) {
    sendData({ type: 'itemCollected', item: itemType, role: role });
  }
}

/**
 * Sync hits over network
 */
function syncMultiplayerHit(role) {
  if (isMultiplayer) {
    sendData({ type: 'rabbitHit' });
  }
}

/**
 * Broadcast Host state periodically
 */
function syncHostState() {
  if (!isMultiplayer || !isHost || gameState.gameStatus !== "play") return;
  var now = performance.now();
  if (now - lastHostSyncTime > 60) { // ~16 updates per second
    lastHostSyncTime = now;
    sendData({
      type: 'hostSync',
      distance: gameState.distance,
      speed: gameState.speed,
      proximity: gameState.proximity,
      level: gameState.level,
      rabbitHits: rabbitHits,
      wolfHits: wolfHits
    });
  }
}

/**
 * Competitive Game Over handler
 */
function handleCompetitiveGameOver(winner, reason) {
  gameState.gameStatus = "gameOver";
  var txt = document.getElementById('gameoverText');
  var sub = document.getElementById('gameoverSubtext');
  var restartBtn = document.getElementById('restartButton');
  var rematchBtn = document.getElementById('rematchButton');

  var isWinner = (myRole === winner);

  if (txt) {
    txt.innerHTML = isWinner ? "¡VICTORIA! 🏆" : "¡DERROTA! 💀";
    txt.style.color = isWinner ? "#4cd137" : "#e84118";
  }

  if (sub) {
    sub.style.display = "block";
    if (winner === 'rabbit') {
      sub.innerHTML = isWinner 
        ? "¡Has escapado a salvo del lobo! 🐰💨" 
        : "El conejo fue más veloz y logró escapar. 🐰";
    } else {
      sub.innerHTML = isWinner 
        ? "¡Cazaste al conejo a tiempo! 🐺🦷" 
        : "El lobo te atrapó. ¡Mejor suerte la próxima! 🐺";
    }
  }

  if (restartBtn) {
    restartBtn.innerText = "Salir al Menú";
    restartBtn.onclick = function() {
      location.href = window.location.pathname;
    };
  }

  if (rematchBtn) {
    rematchBtn.style.display = "inline-block";
    rematchBtn.innerText = "⚔️ Revancha";
    rematchBtn.style.animation = "";
  }

  // Show UI overlay
  var instr = document.getElementById('gameoverInstructions');
  var overlay = document.getElementById('gameOverOverlay');
  if (instr) instr.className = "show";
  if (overlay) overlay.className = "show";
}

/**
 * Revancha (Rematch) handling
 */
function requestRematch() {
  rematchRequestedByMe = true;
  var rematchBtn = document.getElementById('rematchButton');
  if (rematchBtn) {
    rematchBtn.innerText = "Esperando al rival...";
  }

  sendData({ type: 'rematch' });

  if (rematchRequestedByOpponent) {
    sendData({ type: 'startRematch' });
    executeRematch();
  }
}

function executeRematch() {
  rematchRequestedByMe = false;
  rematchRequestedByOpponent = false;

  var instr = document.getElementById('gameoverInstructions');
  var overlay = document.getElementById('gameOverOverlay');
  if (instr) instr.className = "";
  if (overlay) overlay.className = "";

  var rematchBtn = document.getElementById('rematchButton');
  if (rematchBtn) rematchBtn.style.display = "none";

  // Re-run countdown and start
  var roleScreen = document.getElementById('roleSelection');
  if (roleScreen) roleScreen.style.display = 'flex';
  setupRoleSelection();
}

/**
 * Update top race bar markers
 */
function updateRaceLine() {
  var p1Marker = document.getElementById('p1Marker');
  var p2Marker = document.getElementById('p2Marker');
  var trackLength = 10000;
  
  var myDist = gameState.distance / 1.5;
  
  if (myRole === 'rabbit') {
    gameState.opponentDistance = myDist - (gameState.proximity * 500);
  } else {
    gameState.opponentDistance = myDist + (gameState.proximity * 500);
  }

  var myPos = Math.min((myDist / trackLength) * 100, 100);
  var oppPos = Math.min((Math.max(0, gameState.opponentDistance) / trackLength) * 100, 100);
  
  if (p1Marker) {
    p1Marker.style.left = myPos + "%";
    p1Marker.innerText = (myRole === 'rabbit' ? "🐰" : "🐺") + " TÚ (" + Math.floor(myDist) + "m)";
  }
  if (p2Marker) {
    p2Marker.style.left = oppPos + "%";
    p2Marker.innerText = (myRole === 'rabbit' ? "🐺" : "🐰") + " RIVAL (" + Math.floor(Math.max(0, gameState.opponentDistance)) + "m)";
  }
}

function broadcastDistance(dist) {
  if (isMultiplayer) {
    sendData({ type: 'distance', value: dist });
  }
}

/**
 * Check URL on load for auto-join
 */
window.addEventListener('DOMContentLoaded', function() {
  var params = new URLSearchParams(window.location.search);
  var roomFromUrl = params.get('room');
  if (roomFromUrl) {
    console.log("Detectada sala en URL:", roomFromUrl);
    setTimeout(function() {
      initMultiplayer(roomFromUrl);
    }, 400);
  }
});
