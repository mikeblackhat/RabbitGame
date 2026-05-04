/**
 * MULTIPLAYER MODULE
 */

var peer;
var conn;
var isHost = false;
var myPeerId = "";
var opponentConnected = false;
var gameReady = false;

function initMultiplayer() {
    peer = new Peer(generateShortId(), { debug: 1 });

    peer.on('open', (id) => {
        myPeerId = id;
        const display = document.getElementById('peerIdDisplay');
        if (display) display.innerText = "Tu ID: " + id;
    });

    peer.on('connection', (c) => {
        if (conn) {
            c.close();
            return;
        }
        conn = c;
        isHost = true;
        setupConnection();
    });

    peer.on('error', (err) => {
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
    const multiMenu = document.getElementById('multiplayerMenu');
    const backBtn = document.getElementById('backToMenuBtn');
    const createBtn = document.getElementById('createRoomBtn');
    const joinBtn = document.getElementById('joinRoomBtn');
    const roomInput = document.getElementById('roomCodeInput');
    const waitingRoom = document.getElementById('waitingRoom');
    const cancelWaiting = document.getElementById('cancelWaitingBtn');

    if (multiBtn) {
        multiBtn.addEventListener('click', () => {
            if (!peer) initMultiplayer();
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            multiMenu.style.display = 'none';
            document.getElementById('startScreen').style.display = 'flex';
        });
    }

    if (createBtn) {
        createBtn.addEventListener('click', () => {
            const freeRoomId = "RABBIT_FREE_ROOM";
            multiMenu.style.display = 'none';
            waitingRoom.style.display = 'flex';
            document.getElementById('currentRoomCode').innerText = "SALA LIBRE";
            
            const checkConn = peer.connect(freeRoomId);
            let timeout = setTimeout(() => {
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
    }

    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            const roomCode = roomInput.value.trim().toUpperCase();
            if (roomCode) {
                connectToRoom(roomCode);
            } else {
                alert("Introduce un código de sala válido");
            }
        });
    }

    if (cancelWaiting) {
        cancelWaiting.addEventListener('click', () => {
            if (conn) conn.close();
            conn = null;
            waitingRoom.style.display = 'none';
            multiMenu.style.display = 'flex';
        });
    }
}

function connectToRoom(id) {
    conn = peer.connect(id);
    isHost = false;
    setupConnection();
}

function setupConnection() {
    conn.on('open', () => {
        opponentConnected = true;
        isMultiplayer = true;
        
        document.getElementById('multiplayerMenu').style.display = 'none';
        document.getElementById('waitingRoom').style.display = 'none';
        document.getElementById('roleSelection').style.display = 'flex';
        
        setupRoleSelection();
    });

    conn.on('data', (data) => handleIncomingData(data));

    conn.on('close', () => {
        alert("El oponente se ha desconectado");
        location.reload();
    });
}

function setupRoleSelection() {
    const rabbitCard  = document.getElementById('selectRabbit');
    const wolfCard    = document.getElementById('selectWolf');
    const waitingMsg  = document.getElementById('roleWaitingMsg');

    if (!isMultiplayer) {
        if (waitingMsg) waitingMsg.style.display = 'none';
        document.querySelectorAll('.status-msg').forEach(el => el.style.display = 'none');
    } else {
        if (waitingMsg) waitingMsg.style.display = 'block';
        document.querySelectorAll('.status-msg').forEach(el => el.style.display = '');
    }

    rabbitCard.onclick = () => chooseRole('rabbit');
    wolfCard.onclick   = () => chooseRole('wolf');
}

function chooseRole(role) {
    myRole = role;
    
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
            if (!isHost) {
                alert("El oponente ya eligió ese rol. Elige el otro.");
                document.getElementById('selectRabbit').classList.remove('disabled', 'selected');
                document.getElementById('selectWolf').classList.remove('disabled', 'selected');
                myRole = "";
                return;
            }
        }
        
        setTimeout(() => {
            document.getElementById('roleSelection').style.display = 'none';
            document.getElementById('raceContainer').style.display = 'block';
            updateRaceLabels();
            if (typeof resetGame === 'function') resetGame();
        }, 1000);
    }
}

function updateRaceLabels() {
    const p1Marker = document.getElementById('p1Marker');
    const p2Marker = document.getElementById('p2Marker');
    
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
            gameState.opponentDistance = data.value;
            updateRaceLine();
            break;
        case 'roleChosen':
            opponentRole = data.role;
            const card = document.getElementById(data.role === 'rabbit' ? 'selectRabbit' : 'selectWolf');
            if (card) card.querySelector('.status-msg').innerText = "OCUPADO";
            checkAllRolesChosen();
            break;
        case 'consumeObstacle':
            if (typeof onOpponentConsume === 'function') onOpponentConsume();
            break;
        case 'gameOver':
            console.log("Opponent Game Over at", data.distance);
            break;
    }
}

function sendData(data) {
    if (conn && conn.open) conn.send(data);
}

function broadcastDistance(dist) {
    sendData({ type: 'distance', value: dist });
}

function updateRaceLine() {
    const p1Marker = document.getElementById('p1Marker');
    const p2Marker = document.getElementById('p2Marker');
    const trackLength = 10000; // Win condition is at 10,000m
    
    // Use same divisor as the main UI distance
    const myDist = gameState.distance / 1.5;
    
    // In single player, the 'opponent' distance is relative to proximity
    if (!isMultiplayer) {
        if (myRole === 'rabbit') {
            // Wolf distance = Rabbit distance - gap
            // proximity is roughly 0 to 0.4. Let's map it to meters.
            gameState.opponentDistance = myDist - (gameState.proximity * 500); 
        } else {
            // Rabbit distance = Wolf distance + gap
            gameState.opponentDistance = myDist + (gameState.proximity * 500);
        }
    }

    const myPos = Math.min((myDist / trackLength) * 100, 100);
    const oppPos = Math.min((gameState.opponentDistance / trackLength) * 100, 100);
    
    if (p1Marker) {
        p1Marker.style.left = myPos + "%";
        p1Marker.innerText = (myRole === 'rabbit' ? "🐰" : "🐺") + " TÚ (" + Math.floor(myDist) + ")";
    }
    if (p2Marker) {
        p2Marker.style.left = oppPos + "%";
        p2Marker.innerText = (opponentRole === 'rabbit' || (!isMultiplayer && myRole === 'wolf') ? "🐰" : "🐺") + " P2 (" + Math.floor(gameState.opponentDistance) + ")";
    }
}

function reinitAsHost(id) {
    if (peer) peer.destroy();
    peer = new Peer(id, { debug: 1 });

    peer.on('open', () => {
        isHost = true;
        document.getElementById('currentRoomCode').innerText = id === "RABBIT_FREE_ROOM" ? "SALA LIBRE" : id;
    });

    peer.on('connection', (c) => {
        if (conn) {
            c.close();
            return;
        }
        conn = c;
        isHost = true;
        setupConnection();
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            alert("La sala libre está llena. Inténtalo de nuevo en un momento.");
            location.reload();
        }
    });
}
