/**
 * MULTIPLAYER MODULE - Competitive Online P2P (PeerJS WebRTC)
 * Real-time synchronization for Rabbit vs Wolf competitive gameplay
 */

var peer = null;
var conn = null;
var isHost = false;
var myPeerId = "";
var currentTargetRoom = "";
var opponentRole = "";
var gameReady = false;
var lastHostSyncTime = 0;
var rematchRequestedByMe = false;
var rematchRequestedByOpponent = false;
var connectionTimeoutTimer = null;
var isConnectedAndReady = false;

// Fast, zero-hang global STUN servers (Google & Cloudflare)
var ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' }
];

// Generate clean short room code (e.g. RAB-2P8)
function generateRoomCode() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var code = "RAB-";
  for (var i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function updateWaitingStatus(text) {
  var hint = document.querySelector('#waitingRoom .waiting-hint');
  if (hint) hint.innerText = text;
}

/**
 * Initialize PeerJS network
 */
function initMultiplayer(targetRoomCode) {
  var urlParams = new URLSearchParams(window.location.search);
  var roomFromUrl = targetRoomCode || urlParams.get('room');

  if (roomFromUrl) {
    roomFromUrl = roomFromUrl.trim().toUpperCase();
    console.log("Iniciando como cliente para unirse a:", roomFromUrl);
    joinAsClient(roomFromUrl);
    return;
  }

  // If already running as host with active ID, don't recreate
  if (peer && !peer.destroyed && myPeerId) {
    return;
  }

  var chosenId = generateRoomCode();
  createHostPeer(chosenId);
}

function createHostPeer(hostId) {
  if (peer && !peer.destroyed) {
    peer.destroy();
  }

  try {
    peer = new Peer(hostId, {
      debug: 1,
      config: { iceServers: ICE_SERVERS }
    });
  } catch (err) {
    console.warn("Fallo con ID personalizado, usando fallback:", err);
    peer = new Peer(null, {
      debug: 1,
      config: { iceServers: ICE_SERVERS }
    });
  }

  peer.on('open', function(id) {
    myPeerId = id;
    console.log("Host Peer listo con ID:", id);
    var display = document.getElementById('peerIdDisplay');
    if (display) display.innerText = "Tu ID de red: " + id;
    var codeEl = document.getElementById('currentRoomCode');
    if (codeEl) codeEl.innerText = id;
    updateWaitingStatus("Comparte el código o el enlace con tu amigo para iniciar el duelo.");
  });

  peer.on('connection', function(incomingConn) {
    console.log("¡Conexión entrante recibida de:", incomingConn.peer);
    updateWaitingStatus("¡Rival detectado! Estableciendo enlace WebRTC...");
    if (conn && conn.open) {
      incomingConn.close();
      return;
    }
    setupActiveConnection(incomingConn, true);
  });

  peer.on('error', function(err) {
    console.warn("PeerJS Host error:", err.type, err);
    if (err.type === 'unavailable-id') {
      createHostPeer(generateRoomCode());
    }
  });

  setupMultiplayerUI();
}

/**
 * Join a room as a client
 */
function joinAsClient(roomId) {
  currentTargetRoom = roomId.trim().toUpperCase();
  isHost = false;
  isConnectedAndReady = false;

  var waitingRoom = document.getElementById('waitingRoom');
  var multiMenu = document.getElementById('multiplayerMenu');
  var startScreen = document.getElementById('startScreen');

  if (startScreen) startScreen.style.display = 'none';
  if (multiMenu) multiMenu.style.display = 'none';
  if (waitingRoom) {
    waitingRoom.style.display = 'flex';
    var codeEl = document.getElementById('currentRoomCode');
    if (codeEl) codeEl.innerText = currentTargetRoom;
    updateWaitingStatus("Conectando al servidor de red...");
  }

  // 35s connection timeout
  if (connectionTimeoutTimer) clearTimeout(connectionTimeoutTimer);
  connectionTimeoutTimer = setTimeout(function() {
    if (!isConnectedAndReady) {
      alert("No se pudo conectar a la sala " + currentTargetRoom + ".\n\nCausa común: El anfitrión recargó o cerró la página. Pídele que cree una nueva sala y te pase el enlace.");
      location.href = window.location.pathname;
    }
  }, 35000);

  // Client creates an auto-assigned peer
  if (peer && !peer.destroyed && peer.open) {
    doClientConnect(currentTargetRoom);
  } else {
    if (peer && !peer.destroyed) peer.destroy();
    peer = new Peer(null, {
      debug: 1,
      config: { iceServers: ICE_SERVERS }
    });

    peer.on('open', function(id) {
      myPeerId = id;
      console.log("Cliente Peer listo con ID:", id);
      updateWaitingStatus("Sala encontrada. Enlazando con el anfitrión...");
      doClientConnect(currentTargetRoom);
    });

    peer.on('error', function(err) {
      console.error("PeerJS Client error:", err.type, err);
      if (err.type === 'peer-unavailable') {
        clearTimeout(connectionTimeoutTimer);
        alert("La sala " + currentTargetRoom + " no existe o el anfitrión cerró la ventana.\n\nPídele a tu amigo que cree una sala nueva y te pase el enlace.");
        location.href = window.location.pathname;
      }
    });
  }

  setupMultiplayerUI();
}

function doClientConnect(targetId) {
  console.log("Intentando conectar con anfitrión:", targetId);
  updateWaitingStatus("Negociando canal de datos con " + targetId + "...");
  var outgoingConn = peer.connect(targetId, {
    serialization: 'json'
  });
  setupActiveConnection(outgoingConn, false);
}

/**
 * Configure active peer connection with handshake loop
 */
function setupActiveConnection(c, isHostRole) {
  conn = c;
  isHost = isHostRole;

  var handshakeInterval = null;

  function onConnected() {
    if (isConnectedAndReady) return;
    isConnectedAndReady = true;

    if (handshakeInterval) clearInterval(handshakeInterval);
    if (connectionTimeoutTimer) clearTimeout(connectionTimeoutTimer);

    console.log("¡WebRTC DataChannel 100% OPERATIVO! Rol:", isHostRole ? "Host" : "Cliente");

    isMultiplayer = true;
    gameState.gameMode = "competitive";

    // Immediate confirmation packet
    try {
      conn.send({ type: 'handshakeConfirm', role: isHostRole ? 'host' : 'client' });
    } catch (e) {}

    // Show role selection screen
    var multiMenu = document.getElementById('multiplayerMenu');
    var waitingRoom = document.getElementById('waitingRoom');
    var startScreen = document.getElementById('startScreen');
    var roleSelection = document.getElementById('roleSelection');

    if (multiMenu) multiMenu.style.display = 'none';
    if (waitingRoom) waitingRoom.style.display = 'none';
    if (startScreen) startScreen.style.display = 'none';
    if (roleSelection) roleSelection.style.display = 'flex';

    setupRoleSelection();
  }

  // Active handshake probe every 300ms
  handshakeInterval = setInterval(function() {
    if (isConnectedAndReady) {
      clearInterval(handshakeInterval);
      return;
    }
    if (conn && conn.open) {
      try {
        conn.send({ type: 'handshake', role: isHostRole ? 'host' : 'client' });
      } catch (e) {}
    }
  }, 300);

  if (conn.open) {
    onConnected();
  } else {
    conn.on('open', onConnected);
  }

  conn.on('data', function(data) {
    if (data && (data.type === 'handshake' || data.type === 'handshakeConfirm')) {
      onConnected();
      return;
    }
    handleIncomingData(data);
  });

  conn.on('close', function() {
    console.log("Conexión cerrada por el oponente");
    if (gameState.gameStatus === "play") {
      alert("El rival se ha desconectado de la partida.");
      location.href = window.location.pathname;
    }
  });

  conn.on('error', function(err) {
    console.error("Error en canal de datos:", err);
  });

  if (conn.peerConnection) {
    conn.peerConnection.oniceconnectionstatechange = function() {
      var state = conn.peerConnection.iceConnectionState;
      console.log("ICE Connection State:", state);
      if (state === 'connected' || state === 'completed') {
        onConnected();
      }
    };
  }
}

/**
 * Send data packet over WebRTC connection
 */
function sendData(data) {
  if (conn && conn.open) {
    try {
      conn.send(data);
    } catch (e) {
      console.warn("Fallo al enviar datos:", e);
    }
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
      if (!peer || peer.destroyed) {
        initMultiplayer();
      }
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
      updateWaitingStatus("Comparte el código o el enlace con tu amigo para iniciar el duelo.");
    };
  }

  if (joinBtn) {
    joinBtn.onclick = function() {
      var code = roomInput.value.trim().toUpperCase();
      if (code) {
        joinAsClient(code);
      } else {
        alert("Por favor ingresa un código de sala válido (ej: RAB-2P8).");
      }
    };
  }

  if (quickMatchBtn) {
    quickMatchBtn.onclick = function() {
      var publicRoom = "RAB-PUB1";
      joinAsClient(publicRoom);
    };
  }

  if (cancelWaiting) {
    cancelWaiting.onclick = function() {
      if (connectionTimeoutTimer) clearTimeout(connectionTimeoutTimer);
      if (conn) {
        conn.close();
        conn = null;
      }
      isConnectedAndReady = false;
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
        executeRematch();
      }
      break;

    case 'startRematch':
      executeRematch();
      break;
  }
}

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

function syncMultiplayerJump(role) {
  if (isMultiplayer) {
    sendData({ type: 'jump', role: role });
  }
}

function syncMultiplayerItem(itemType, role) {
  if (isMultiplayer) {
    sendData({ type: 'itemCollected', item: itemType, role: role });
  }
}

function syncMultiplayerHit(role) {
  if (isMultiplayer) {
    sendData({ type: 'rabbitHit' });
  }
}

function syncHostState() {
  if (!isMultiplayer || !isHost || gameState.gameStatus !== "play") return;
  var now = performance.now();
  if (now - lastHostSyncTime > 60) {
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

  var instr = document.getElementById('gameoverInstructions');
  var overlay = document.getElementById('gameOverOverlay');
  if (instr) instr.className = "show";
  if (overlay) overlay.className = "show";
}

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

  var roleScreen = document.getElementById('roleSelection');
  if (roleScreen) roleScreen.style.display = 'flex';
  setupRoleSelection();
}

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

// Auto-check on load
window.addEventListener('DOMContentLoaded', function() {
  var params = new URLSearchParams(window.location.search);
  var roomFromUrl = params.get('room');
  if (roomFromUrl) {
    console.log("Detectada sala en URL:", roomFromUrl);
    setTimeout(function() {
      initMultiplayer(roomFromUrl);
    }, 200);
  }
});
