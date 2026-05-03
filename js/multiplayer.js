/**
 * MULTIPLAYER MODULE
 * Handles PeerJS connections and room logic
 */

var peer;
var conn;
var isHost = false;
var opponentDistance = 0;
var myPeerId = "";
var isMultiplayer = false;
var opponentConnected = false;
var myRole = "rabbit"; // default
var opponentRole = "";
var gameReady = false;

function initMultiplayer() {
    // PeerJS initialization
    peer = new Peer(generateShortId(), {
        debug: 1
    });

    peer.on('open', function (id) {
        myPeerId = id;
        document.getElementById('peerIdDisplay').innerText = "Tu ID: " + id;
    });

    peer.on('connection', function (c) {
        // Someone joined our room
        if (conn) {
            c.close();
            return;
        }
        conn = c;
        isHost = true;
        setupConnection();
    });

    peer.on('error', function (err) {
        console.error("PeerJS Error:", err);
        alert("Error de conexión: " + err.type);
    });

    setupMultiplayerUI();
}

function generateShortId() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function setupMultiplayerUI() {
    const multiBtn = document.getElementById('multiplayerButton');
    const startScreen = document.getElementById('startScreen');
    const multiMenu = document.getElementById('multiplayerMenu');
    const backBtn = document.getElementById('backToMenuBtn');
    const createBtn = document.getElementById('createRoomBtn');
    const joinBtn = document.getElementById('joinRoomBtn');
    const roomInput = document.getElementById('roomCodeInput');
    const waitingRoom = document.getElementById('waitingRoom');
    const cancelWaiting = document.getElementById('cancelWaitingBtn');

    multiBtn.addEventListener('click', () => {
        startScreen.style.display = 'none';
        multiMenu.style.display = 'flex';
        if (!peer) initMultiplayer();
    });

    backBtn.addEventListener('click', () => {
        multiMenu.style.display = 'none';
        startScreen.style.display = 'flex';
    });

    createBtn.addEventListener('click', () => {
        // "Sala Libre" logic
        const freeRoomId = "RABBIT_FREE_ROOM";
        multiMenu.style.display = 'none';
        waitingRoom.style.display = 'flex';
        document.getElementById('currentRoomCode').innerText = "SALA LIBRE";
        
        // Try to join first
        const checkConn = peer.connect(freeRoomId);
        let timeout = setTimeout(() => {
            // If no connection after 2 seconds, we try to become the host
            // Note: PeerJS doesn't let us change our ID after initialization.
            // So we need to re-init with the freeRoomId.
            checkConn.close();
            reinitAsHost(freeRoomId);
        }, 2000);

        checkConn.on('open', () => {
            clearTimeout(timeout);
            conn = checkConn;
            isHost = false;
            setupConnection();
        });
    });

    joinBtn.addEventListener('click', () => {
        const roomCode = roomInput.value.trim().toUpperCase();
        if (roomCode) {
            connectToRoom(roomCode);
        } else {
            alert("Introduce un código de sala válido");
        }
    });

    cancelWaiting.addEventListener('click', () => {
        if (conn) conn.close();
        conn = null;
        waitingRoom.style.display = 'none';
        multiMenu.style.display = 'flex';
    });
}

function connectToRoom(id) {
    conn = peer.connect(id);
    isHost = false;
    setupConnection();
}

function setupConnection() {
    conn.on('open', function () {
        opponentConnected = true;
        isMultiplayer = true;
        
        // Hide menus and show role selection
        document.getElementById('multiplayerMenu').style.display = 'none';
        document.getElementById('waitingRoom').style.display = 'none';
        document.getElementById('roleSelection').style.display = 'flex';
        
        setupRoleSelection();
    });

    conn.on('data', function (data) {
        handleIncomingData(data);
    });

    conn.on('close', function () {
        alert("El oponente se ha desconectado");
        location.reload();
    });
}

function setupRoleSelection() {
    const rabbitCard  = document.getElementById('selectRabbit');
    const wolfCard    = document.getElementById('selectWolf');
    const waitingMsg  = document.getElementById('roleWaitingMsg');

    if (!isMultiplayer) {
        // Solo mode — no opponent to wait for
        if (waitingMsg) waitingMsg.style.display = 'none';
        // Hide the "Esperando..." status tags inside each card
        document.querySelectorAll('.status-msg').forEach(function (el) {
            el.style.display = 'none';
        });
    } else {
        if (waitingMsg) waitingMsg.style.display = 'block';
        document.querySelectorAll('.status-msg').forEach(function (el) {
            el.style.display = '';
        });
    }

    rabbitCard.onclick = () => chooseRole('rabbit');
    wolfCard.onclick   = () => chooseRole('wolf');
}

function chooseRole(role) {
    myRole = role;
    
    // UI update — highlight chosen card, grey out the other
    const rabbitCard = document.getElementById('selectRabbit');
    const wolfCard   = document.getElementById('selectWolf');
    
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
            // Conflict! If host, you keep it, guest must change
            if (!isHost) {
                alert("El oponente ya eligió ese rol. Elige el otro.");
                document.getElementById('selectRabbit').classList.remove('disabled', 'selected');
                document.getElementById('selectWolf').classList.remove('disabled', 'selected');
                myRole = "";
                return;
            }
        }
        
        // Roles are distinct or solo mode, start game
        setTimeout(() => {
            document.getElementById('roleSelection').style.display = 'none';
            document.getElementById('raceContainer').style.display = 'block';
            
            // Update labels based on roles
            updateRaceLabels();
            
            if (typeof resetGame === 'function') {
                resetGame();
            }
        }, 1000);
    }
}

function updateRaceLabels() {
    const p1Marker = document.getElementById('p1Marker');
    const p2Marker = document.getElementById('p2Marker');
    const oppName = isMultiplayer ? (opponentRole === 'rabbit' ? "CONEJO" : "LOBO") : "CPU";
    
    if (myRole === 'rabbit') {
        p1Marker.innerText = "🐰 CONEJO (TÚ)";
        p2Marker.innerText = (opponentRole === 'wolf' ? "🐺 LOBO" : "🤖 CPU");
        p1Marker.style.background = "#dc5f45";
        p2Marker.style.background = "#5f9042";
    } else {
        p1Marker.innerText = "🐺 LOBO (TÚ)";
        p2Marker.innerText = (opponentRole === 'rabbit' ? "🐰 CONEJO" : "🤖 CPU");
        p1Marker.style.background = "#5f9042";
        p2Marker.style.background = "#dc5f45";
    }
}

function handleIncomingData(data) {
    switch (data.type) {
        case 'distance':
            opponentDistance = data.value;
            updateRaceLine();
            break;
        case 'roleChosen':
            opponentRole = data.role;
            document.getElementById(data.role === 'rabbit' ? 'selectRabbit' : 'selectWolf').querySelector('.status-msg').innerText = "OCUPADO";
            checkAllRolesChosen();
            break;
        case 'consumeObstacle':
            // Wolf consumed an obstacle
            if (typeof onOpponentConsume === 'function') onOpponentConsume();
            break;
        case 'gameOver':
            console.log("Opponent Game Over at", data.distance);
            break;
        case 'ready':
            console.log("Opponent ready");
            break;
    }
}

function sendData(data) {
    if (conn && conn.open) {
        conn.send(data);
    }
}

function broadcastDistance(dist) {
    sendData({ type: 'distance', value: dist });
}

function updateRaceLine() {
    const p1Marker = document.getElementById('p1Marker');
    const p2Marker = document.getElementById('p2Marker');
    
    // We use a relative progress or just scale the distance
    // Let's say the track is 5000 units long for the progress bar scaling
    const trackLength = 5000; 
    
    const myDist = (typeof distance !== 'undefined') ? distance / 2 : 0;
    const myPos = Math.min((myDist / trackLength) * 100, 100);
    const oppPos = Math.min((opponentDistance / trackLength) * 100, 100);
    
    p1Marker.style.left = myPos + "%";
    p2Marker.style.left = oppPos + "%";
    
    // Update labels if needed
    p1Marker.innerText = "🐰 P1 (" + Math.floor(myDist) + ")";
    p2Marker.innerText = "🐺 P2 (" + Math.floor(opponentDistance) + ")";
}

function reinitAsHost(id) {
    if (peer) peer.destroy();
    
    peer = new Peer(id, {
        debug: 1
    });

    peer.on('open', function () {
        isHost = true;
        console.log("Acting as host for ID:", id);
        document.getElementById('currentRoomCode').innerText = id === "RABBIT_FREE_ROOM" ? "SALA LIBRE" : id;
    });

    peer.on('connection', function (c) {
        if (conn) {
            c.close();
            return;
        }
        conn = c;
        isHost = true;
        setupConnection();
    });

    peer.on('error', function (err) {
        if (err.type === 'unavailable-id') {
            alert("La sala libre está llena. Inténtalo de nuevo en un momento.");
            location.reload();
        }
    });
}
