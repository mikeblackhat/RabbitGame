/**
 * WOLF MODE MODULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles:
 *  • Rabbit AI  — autonomously dodges hedgehogs and jumps for carrots
 *  • Wolf input — any click/tap = bite attempt
 *  • Wolf UI    — hint tooltip, eat-feedback, miss-feedback
 *  • consumeObstacle / onOpponentConsume (shared with multiplayer wolf)
 */

// ─── RABBIT AI ───────────────────────────────────────────────────────────────
var rabbitAI = {
  /** Angular distance at which AI detects the approaching hedgehog */
  reactionDistance: 0.55,
  /** Jump cooldown timer (seconds) — prevents spam jumps */
  jumpCooldown: 0,
  /** Evasion boost applied when the wolf is dangerously close */
  evasionBoost: 0,

  update: function (dt) {
    if (gameStatus !== 'play') return;
    this.jumpCooldown -= dt;

    // ── Dodge hedgehog ──────────────────────────────────────────────────────
    // Hero sits at the TOP of the circular floor ≈ angle PI/2.
    // We detect when the obstacle enters a reaction window around that point.
    var heroPosAngle = Math.PI / 2;   // ~1.57 rad — the actual collision zone
    var obstAngle    = (floorRotation + obstacle.angle) % (Math.PI * 2);
    var angleDiff    = Math.abs(heroPosAngle - obstAngle);
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

    if (obstacle.status !== 'flying' && angleDiff < this.reactionDistance && this.jumpCooldown <= 0) {
      if (hero.status !== 'jumping') {
        hero.jump();
        this.jumpCooldown = 0.6 + Math.random() * 0.4; // slight human randomness
      }
    }

    // ── Jump for carrot ─────────────────────────────────────────────────────
    // Carrots orbit at floorRadius+50, collectible near angle PI/2 (top).
    var carrotWorldAngle = (floorRotation + carrot.angle) % (Math.PI * 2);
    var carrotApproach   = Math.abs(carrotWorldAngle - Math.PI / 2);
    if (carrotApproach > Math.PI) carrotApproach = Math.PI * 2 - carrotApproach;

    if (carrotApproach < 0.4 && this.jumpCooldown <= 0) {
      if (hero.status !== 'jumping') {
        hero.jump();
        this.jumpCooldown = 1.0;
      }
    }

    // ── Evasion burst when wolf is dangerously close ─────────────────────────
    // monsterPos < 0.62 = wolf is close (game over at < 0.56)
    if (monsterPos < 0.62) {
      this.evasionBoost += dt * 0.0008;
      monsterPosTarget  += this.evasionBoost;           // push wolf back a little
      this.evasionBoost  = Math.min(this.evasionBoost, 0.002);
    } else {
      this.evasionBoost = 0;
    }
  },

  reset: function () {
    this.jumpCooldown = 0;
    this.evasionBoost = 0;
  }
};

// ─── LIVES SYSTEM ────────────────────────────────────────────────────────────
var rabbitHits = 0;
var wolfHits   = 0;
var MAX_HITS   = 3;

function onRabbitHit() {
  rabbitHits++;
  updateLivesDisplay();
  if (rabbitHits >= MAX_HITS) {
    var el = document.getElementById('gameoverInstructions');
    if (el) el.innerHTML = '¡LOBO GANA! 🐺';
    gameOver();
  }
}

function onWolfHit() {
  wolfHits++;
  updateLivesDisplay();
  _showWolfPopup('wolfMissFeedback', '💥 ¡Chocaste!');
  if (wolfHits >= MAX_HITS) {
    var el = document.getElementById('gameoverInstructions');
    if (el) el.innerHTML = '¡EL CONEJO ESCAPA! 🐰';
    gameOver();
  }
}

function updateLivesDisplay() {
  var rb = document.getElementById('rabbitLivesDisplay');
  var wb = document.getElementById('wolfLivesDisplay');
  if (rb) rb.innerHTML = livesHTML(MAX_HITS - rabbitHits);
  if (wb) wb.innerHTML = livesHTML(MAX_HITS - wolfHits);
}

function livesHTML(remaining) {
  var s = '';
  for (var i = 0; i < MAX_HITS; i++) s += i < remaining ? '❤️' : '🖤';
  return s;
}

function resetLives() {
  rabbitHits = 0;
  wolfHits   = 0;
  wolfObstacleActive   = false;
  wolfObstacleTimer    = 6;
  wolfObstacleTimeLeft = 0;
  var oc = document.getElementById('wolfObstacleContainer');
  if (oc) oc.style.display = 'none';
  updateLivesDisplay();
  var lc = document.getElementById('livesContainer');
  if (lc) lc.style.display = 'flex';
}

// ─── WOLF OBSTACLE ───────────────────────────────────────────────────────────
var wolfObstacleActive   = false;
var wolfObstacleTimer    = 6;    // seconds until first obstacle appears
var wolfObstacleTimeLeft = 0;
var wolfObstacleWindow   = 2.8;  // seconds wolf has to react

function tickWolfObstacle(dt) {
  if (wolfObstacleTimer > 0) { wolfObstacleTimer -= dt; return; }

  if (!wolfObstacleActive) {
    wolfObstacleActive   = true;
    wolfObstacleTimeLeft = wolfObstacleWindow;
    spawnWolfObstacle();
  } else {
    wolfObstacleTimeLeft -= dt;
    var pct = Math.max(0, wolfObstacleTimeLeft / wolfObstacleWindow);
    var bar = document.getElementById('wolfObstacleProgress');
    if (bar) bar.style.width = (pct * 100) + '%';
    if (wolfObstacleTimeLeft <= 0) {
      wolfObstacleActive = false;
      wolfObstacleTimer  = Math.max(4, 8 - (typeof level !== 'undefined' ? level * 0.4 : 0));
      hideWolfObstacleUI();
      onWolfHit();
    }
  }
}

function spawnWolfObstacle() {
  var container = document.getElementById('wolfObstacleContainer');
  if (!container) return;
  container.style.display = 'flex';
  var rock = document.getElementById('wolfObstacleRock');
  if (rock) {
    TweenMax.killTweensOf(rock);
    TweenMax.fromTo(rock, wolfObstacleWindow,
      { left: '105%' },
      { left: '-20%', ease: Linear.easeNone }
    );
  }
  var bar = document.getElementById('wolfObstacleProgress');
  if (bar) bar.style.width = '100%';
}

function hideWolfObstacleUI() {
  var container = document.getElementById('wolfObstacleContainer');
  if (container) container.style.display = 'none';
  var rock = document.getElementById('wolfObstacleRock');
  if (rock) TweenMax.killTweensOf(rock);
}

function wolfJump() {
  if (!wolfObstacleActive || gameStatus !== 'play') return;
  wolfObstacleActive = false;
  wolfObstacleTimer  = Math.max(4, 8 - (typeof level !== 'undefined' ? level * 0.4 : 0));
  hideWolfObstacleUI();
  _showWolfPopup('wolfEatFeedback', '⬆️ ¡Saltó!');
}

function setupWolfJumpControls() {
  document.addEventListener('keydown', function (e) {
    if ((e.code === 'Space' || e.key === ' ') && myRole === 'wolf') {
      e.preventDefault();
      wolfJump();
    }
  });
  var btn = document.getElementById('wolfJumpBtn');
  if (btn) {
    btn.addEventListener('mousedown', function (e) { e.stopPropagation(); wolfJump(); });
    btn.addEventListener('touchstart', function (e) { e.stopPropagation(); e.preventDefault(); wolfJump(); });
  }
}

// ─── WOLF BITE COOLDOWN ───────────────────────────────────────────────────────
var wolfBiteCooldown = 0;

/**
 * Called every frame from the main loop when myRole === 'wolf'.
 * Decrements the bite cooldown, runs rabbit AI and wolf obstacle.
 */
function updateWolfMode(dt) {
  if (wolfBiteCooldown > 0) wolfBiteCooldown -= dt;
  if (!isMultiplayer) {
    rabbitAI.update(dt);
    tickWolfObstacle(dt);
  }
}

// ─── WOLF INPUT ───────────────────────────────────────────────────────────────

/** Any mouse click = wolf bites */
function handleWolfClick(event) {
  if (gameStatus !== 'play') return;
  wolfBiteAttempt();
}

/** Any touch tap = wolf bites */
function handleWolfTouchClick(event) {
  if (gameStatus !== 'play') return;
  event.preventDefault();
  wolfBiteAttempt();
}

function wolfBiteAttempt() {
  if (wolfBiteCooldown > 0) return;          // cooldown active

  if (obstacle.status === 'flying') {        // hedgehog already eaten/flying
    showWolfMissFeedback();
    return;
  }

  consumeObstacle();
  wolfBiteCooldown = 0.8;                    // 0.8 s before next bite (snappier)
}

// ─── CONSUME OBSTACLE ────────────────────────────────────────────────────────

function consumeObstacle() {
  obstacle.status = 'flying';

  var tx = (Math.random() > 0.5) ? -20 - Math.random() * 10 : 20 + Math.random() * 5;
  TweenMax.to(obstacle.mesh.position, 3, {
    x: tx, y: Math.random() * 50 + 20, z: 350, ease: Power4.easeOut
  });
  TweenMax.to(obstacle.mesh.rotation, 3, {
    x: Math.PI * 3, z: Math.PI * 3, y: Math.PI * 6,
    ease: Power4.easeOut,
    onComplete: function () {
      obstacle.status            = 'ready';
      obstacle.body.rotation.y   = Math.random() * Math.PI * 2;
      obstacle.angle             = -floorRotation - Math.random() * 0.4;
      obstacle.angle             = obstacle.angle % (Math.PI * 2);
      obstacle.mesh.rotation.set(0, 0, 0);
      obstacle.mesh.position.z   = 0;
    }
  });

  // Wolf gains a speed burst — monster moves CLOSER to rabbit (monsterPos decreases)
  // monsterPosTarget DECREASING = wolf catching up (game over when < 0.56)
  monsterPosTarget -= 0.07;
  if (monsterPosTarget < 0.58) monsterPosTarget = 0.58;  // don't instant-catch on one bite

  showWolfEatFeedback();
  playBonusSound();

  if (isMultiplayer) sendData({ type: 'consumeObstacle' });
}

/** Called on the RABBIT side when the wolf (online) ate the hedgehog */
function onOpponentConsume() {
  getMalus();               // obstacle flies away
  monsterPosTarget -= 0.07; // wolf gets closer on rabbit's screen too
}

// ─── WOLF UI HELPERS ──────────────────────────────────────────────────────────

function showWolfHint() {
  var hint = document.getElementById('wolfHint');
  if (!hint) {
    hint           = document.createElement('div');
    hint.id        = 'wolfHint';
    hint.innerHTML = '🐺 ¡HAZ CLIC para morder al erizo y ganar velocidad!';
    document.body.appendChild(hint);
  }
  hint.style.display = 'block';
  clearTimeout(hint._timeout);
  hint._timeout = setTimeout(function () {
    hint.style.opacity = '0';
    setTimeout(function () {
      hint.style.display  = 'none';
      hint.style.opacity  = '1';
    }, 800);
  }, 5000);
}

function showWolfEatFeedback() {
  _showWolfPopup('wolfEatFeedback', '💨 ¡MORDIDA! +VELOCIDAD');
}

function showWolfMissFeedback() {
  _showWolfPopup('wolfMissFeedback', '❌ ¡Ya no está!');
}

/** Internal helper — animates a temporary popup div */
function _showWolfPopup(id, text) {
  var el = document.getElementById(id);
  if (!el) {
    el           = document.createElement('div');
    el.id        = id;
    el.className = 'wolfPopup';
    document.body.appendChild(el);
  }
  el.innerHTML        = text;
  el.style.display    = 'block';
  el.style.opacity    = '1';
  TweenMax.killTweensOf(el);
  TweenMax.set(el, { y: 0, scale: 1 });
  TweenMax.to(el, 0.12, { scale: 1.25 });
  TweenMax.to(el, 0.7, {
    opacity: 0, y: -50, scale: 1, delay: 0.25,
    onComplete: function () {
      el.style.display = 'none';
      TweenMax.set(el, { y: 0 });
    }
  });
}
