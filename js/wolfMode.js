/**
 * WOLF MODE MODULE  (rewrite v3)
 * ─────────────────────────────────────────────────────────────────────────────
 *  RABBIT (IA)
 *    • Esquiva automáticamente el erizo del conejo (salto al ángulo correcto)
 *    • Salta para recoger zanahorias
 *    • 3 golpes de erizo → muere → LOBO GANA
 *
 *  LOBO (tú)
 *    • CLIC en cualquier parte → morder el erizo del track → gana velocidad
 *    • ESPACIO / botón SALTAR → saltar el obstáculo periódico (erizo propio)
 *    • 3 fallos al saltar → CONEJO ESCAPA
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── RABBIT AI ───────────────────────────────────────────────────────────────
var rabbitAI = {
  reactionDist : 0.55,   // radio de detección del erizo
  jumpCooldown : 0,
  evasionBoost : 0,

  update: function (dt) {
    if (gameStatus !== 'play') return;
    this.jumpCooldown -= dt;

    // ── Esquivar erizo ────────────────────────────────────────────────────────
    // El héroe está en la parte superior del círculo ≈ ángulo PI/2
    var heroAngle  = Math.PI / 2;
    var obstAngle  = (floorRotation + obstacle.angle) % (Math.PI * 2);
    var diff       = Math.abs(heroAngle - obstAngle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;

    if (obstacle.status !== 'flying' && diff < this.reactionDist && this.jumpCooldown <= 0) {
      if (hero.status !== 'jumping') {
        hero.jump();
        this.jumpCooldown = 0.6 + Math.random() * 0.4;
      }
    }

    // ── Saltar por zanahoria ──────────────────────────────────────────────────
    // Las zanahorias se recogen saltando cerca del ángulo PI/2
    var carrotAngle = (floorRotation + carrot.angle) % (Math.PI * 2);
    var carrotDiff  = Math.abs(carrotAngle - Math.PI / 2);
    if (carrotDiff > Math.PI) carrotDiff = Math.PI * 2 - carrotDiff;

    if (carrotDiff < 0.40 && this.jumpCooldown <= 0) {
      if (hero.status !== 'jumping') {
        hero.jump();
        this.jumpCooldown = 1.0;
      }
    }

    // ── Boost de evasión cuando el lobo está muy cerca ────────────────────────
    if (monsterPos < 0.62) {
      this.evasionBoost += dt * 0.0008;
      monsterPosTarget  += this.evasionBoost;
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

// ─── VIDAS ───────────────────────────────────────────────────────────────────
var rabbitHits = 0;
var wolfHits   = 0;
var MAX_HITS   = 3;

function onRabbitHit() {
  rabbitHits++;
  updateLivesDisplay();
  showHitFlash('#dc5f45');
  if (rabbitHits >= MAX_HITS) {
    document.getElementById('gameoverInstructions').innerHTML = '¡LOBO GANA! 🐺';
    gameOver();
  }
}

function onWolfHit() {
  wolfHits++;
  updateLivesDisplay();
  showHitFlash('#2575fc');
  _wolfPopup('wolfMissEl', '💥 ¡FALLASTE!');
  if (wolfHits >= MAX_HITS) {
    document.getElementById('gameoverInstructions').innerHTML = '¡EL CONEJO ESCAPA! 🐰';
    gameOver();
  }
}

function updateLivesDisplay() {
  var rb = document.getElementById('rabbitLivesDisplay');
  var wb = document.getElementById('wolfLivesDisplay');
  function hearts(n) {
    var s = '';
    for (var i = 0; i < MAX_HITS; i++) s += i < n ? '❤️' : '🖤';
    return s;
  }
  if (rb) rb.innerHTML = hearts(MAX_HITS - rabbitHits);
  if (wb) wb.innerHTML = hearts(MAX_HITS - wolfHits);
}

function showHitFlash(color) {
  var f = document.getElementById('hitFlash');
  if (!f) {
    f = document.createElement('div');
    f.id = 'hitFlash';
    document.body.appendChild(f);
  }
  f.style.background = color;
  f.style.opacity = '0.35';
  TweenMax.to(f, 0.4, { opacity: 0 });
}

function resetLives() {
  rabbitHits = 0;
  wolfHits   = 0;
  updateLivesDisplay();
  var lc = document.getElementById('livesContainer');
  if (lc) lc.style.display = 'flex';
  hideWolfObstacleUI();
  wolfObstTimer   = 6;
  wolfObstActive  = false;
  wolfObstLeft    = 0;
  wolfIsJumping   = false;
  wolfJumpOff.v   = 0;
}

// ─── MORDIDA DEL LOBO (CLIC = morder erizo del track) ────────────────────────
var wolfBiteCooldown = 0;

function wolfBiteAttempt() {
  if (gameStatus !== 'play') return;
  if (wolfBiteCooldown > 0) return;

  if (obstacle.status === 'flying') {
    _wolfPopup('wolfMissEl', '🌀 Ya no está');
    return;
  }
  // Morder erizo → gana velocidad
  obstacle.status = 'flying';
  var tx = Math.random() > 0.5 ? -25 - Math.random() * 10 : 25 + Math.random() * 10;
  TweenMax.to(obstacle.mesh.position, 2.5, { x: tx, y: 40 + Math.random() * 30, z: 350, ease: Power4.easeOut });
  TweenMax.to(obstacle.mesh.rotation, 2.5, {
    x: Math.PI * 3, y: Math.PI * 6, z: Math.PI * 3, ease: Power4.easeOut,
    onComplete: function () {
      obstacle.status = 'ready';
      obstacle.body.rotation.y = Math.random() * Math.PI * 2;
      obstacle.angle = -floorRotation - Math.random() * 0.4;
      obstacle.angle = obstacle.angle % (Math.PI * 2);
      obstacle.mesh.rotation.set(0, 0, 0);
      obstacle.mesh.position.z = 0;
    }
  });

  monsterPosTarget -= 0.07;                          // lobo se acerca
  if (monsterPosTarget < 0.58) monsterPosTarget = 0.58;
  wolfBiteCooldown = 0.8;
  playBonusSound();
  _wolfPopup('wolfEatEl', '🐺 ¡MORDIDA! +VEL');
  if (isMultiplayer) sendData({ type: 'consumeObstacle' });
}

function onOpponentConsume() { getMalus(); monsterPosTarget -= 0.07; }

// ─── OBSTÁCULO DEL LOBO (ESPACIO / SALTAR para saltar) ───────────────────────
// El monstruo salta visualmente en 3D (offset radial en updateMonsterPosition)
var wolfJumpOff  = { v: 0 };
var wolfIsJumping = false;

var wolfObstActive  = false;
var wolfObstTimer   = 6;      // segundos hasta el primer obstáculo
var wolfObstLeft    = 0;
var WOLF_OBST_WIN   = 2.8;    // ventana de reacción (segundos)

function wolfJump() {
  if (gameStatus !== 'play') return;
  if (wolfIsJumping) return;
  wolfIsJumping = true;
  var spd = Math.max(0.35, 7 / Math.max(speed || 5, 1));
  TweenMax.killTweensOf(wolfJumpOff);
  TweenMax.to(wolfJumpOff, spd / 2, { v: 40, ease: Power2.easeOut });
  TweenMax.to(wolfJumpOff, spd / 2, {
    v: 0, ease: Power4.easeIn, delay: spd / 2,
    onComplete: function () { wolfIsJumping = false; }
  });
}

function tickWolfObstacle(dt) {
  if (wolfObstTimer > 0) { wolfObstTimer -= dt; return; }

  if (!wolfObstActive) {
    wolfObstActive = true;
    wolfObstLeft   = WOLF_OBST_WIN;
    showWolfObstacleUI();
  } else {
    wolfObstLeft -= dt;
    var pct = Math.max(0, wolfObstLeft / WOLF_OBST_WIN);
    var bar = document.getElementById('wolfObstacleProgress');
    if (bar) bar.style.width = (pct * 100) + '%';

    if (wolfObstLeft <= 0) {
      wolfObstActive = false;
      wolfObstTimer  = Math.max(4, 9 - (typeof level !== 'undefined' ? level * 0.5 : 0));
      hideWolfObstacleUI();
      if (!wolfIsJumping) {
        onWolfHit();
      } else {
        _wolfPopup('wolfEatEl', '⬆️ ¡Esquivó!');
      }
    }
  }
}

function showWolfObstacleUI() {
  var c = document.getElementById('wolfObstacleContainer');
  if (c) c.style.display = 'flex';
  var bar = document.getElementById('wolfObstacleProgress');
  if (bar) bar.style.width = '100%';
}

function hideWolfObstacleUI() {
  var c = document.getElementById('wolfObstacleContainer');
  if (c) c.style.display = 'none';
}

// ─── LOOP UPDATE (llamado desde main.js) ─────────────────────────────────────
function updateWolfMode(dt) {
  if (wolfBiteCooldown > 0) wolfBiteCooldown -= dt;
  if (!isMultiplayer) {
    rabbitAI.update(dt);
    tickWolfObstacle(dt);
  }
}

// ─── CONTROLES ───────────────────────────────────────────────────────────────
function handleWolfClick(e) {
  if (gameStatus !== 'play') return;
  wolfBiteAttempt();
}

function handleWolfTouchClick(e) {
  if (gameStatus !== 'play') return;
  e.preventDefault();
  wolfBiteAttempt();
}

function setupWolfJumpControls() {
  document.addEventListener('keydown', function (e) {
    if (myRole !== 'wolf') return;
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); wolfJump(); }
  });
  var btn = document.getElementById('wolfJumpBtn');
  if (btn) {
    btn.addEventListener('mousedown', function (e) { e.stopPropagation(); wolfJump(); });
    btn.addEventListener('touchstart', function (e) { e.stopPropagation(); e.preventDefault(); wolfJump(); });
  }
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────
function showWolfHint() {
  var h = document.getElementById('wolfHint');
  if (!h) {
    h = document.createElement('div');
    h.id = 'wolfHint';
    document.body.appendChild(h);
  }
  h.innerHTML = '🐺 CLIC = morder erizo &nbsp;|&nbsp; ESPACIO = saltar obstáculo';
  h.style.display = 'block';
  h.style.opacity = '1';
  clearTimeout(h._t);
  h._t = setTimeout(function () {
    TweenMax.to(h, 0.8, { opacity: 0, onComplete: function () { h.style.display = 'none'; h.style.opacity = '1'; } });
  }, 5000);
}

function _wolfPopup(id, text) {
  var el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = 'wolfPopup';
    document.body.appendChild(el);
  }
  el.innerHTML = text;
  el.style.display = 'block';
  el.style.opacity = '1';
  TweenMax.killTweensOf(el);
  TweenMax.set(el, { y: 0, scale: 1 });
  TweenMax.to(el, 0.12, { scale: 1.2 });
  TweenMax.to(el, 0.65, { opacity: 0, y: -45, scale: 1, delay: 0.2,
    onComplete: function () { el.style.display = 'none'; TweenMax.set(el, { y: 0 }); }
  });
}
