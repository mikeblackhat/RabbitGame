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

var rabbitAI = {
  reactionDist : 0.75, // Reacts much earlier
  jumpCooldown : 0,
  evasionBoost : 0,

  update: function (dt) {
    if (gameStatus !== 'play') return;
    this.jumpCooldown -= dt;

    // ── Dynamic reaction based on speed ──────────────────────────────────────
    var currentSpeedFactor = (speed / initSpeed);
    var adjustedReactionDist = this.reactionDist * (1 + (currentSpeedFactor - 1) * 0.1);

    // ── Detected obstacles ────────────────────────────────────────────────────
    var heroAngle  = Math.PI / 2;
    var obstAngle  = (floorRotation + obstacle.angle) % (Math.PI * 2);
    var carrotAngle = (floorRotation + carrot.angle) % (Math.PI * 2);

    var obstDiff   = Math.abs(heroAngle - obstAngle);
    if (obstDiff > Math.PI) obstDiff = Math.PI * 2 - obstDiff;

    var carrotDiff = Math.abs(heroAngle - carrotAngle);
    if (carrotDiff > Math.PI) carrotDiff = Math.PI * 2 - carrotDiff;

    // ── 1. Priority: Avoid Hedgehogs ──────────────────────────────────────────
    // AI now has near-perfect dodging with a very short cooldown
    if (obstacle.status !== 'flying' && obstDiff < adjustedReactionDist && this.jumpCooldown <= 0) {
      if (hero.status !== 'jumping') {
        hero.jump();
        this.jumpCooldown = 0.3; // Very quick recovery
      }
      return; 
    }

    // ── 2. Secondary: Get Carrots (Only if very safe) ─────────────────────────
    var landingZoneObstAngle = (floorRotation + obstacle.angle + 0.3) % (Math.PI * 2); 
    var landingObstDiff = Math.abs(heroAngle - landingZoneObstAngle);
    if (landingObstDiff > Math.PI) landingObstDiff = Math.PI * 2 - landingObstDiff;

    if (carrotDiff < 0.4 && this.jumpCooldown <= 0 && landingObstDiff > 0.6) {
      if (hero.status !== 'jumping') {
        hero.jump();
        this.jumpCooldown = 0.5;
      }
    }

    // ── 3. Strategic: Escape Boost (Almost impossible to catch) ───────────────
    // If the wolf is close (< 0.65), the rabbit AI generates massive distance
    if (monsterPos < 0.65) {
      this.evasionBoost += dt * 0.005; // Rapidly increases gap
      monsterPosTarget  += this.evasionBoost;
      this.evasionBoost  = Math.min(this.evasionBoost, 0.015);
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
    var txt = document.getElementById('gameoverText');
    if (txt) txt.innerHTML = '¡LOBO GANA! 🐺';
    gameOver();
  }
}

function onWolfHit() {
  wolfHits++;
  updateLivesDisplay();
  showHitFlash('#2575fc');
  _wolfPopup('wolfMissEl', '💥 ¡FALLASTE!');
  if (wolfHits >= MAX_HITS) {
    var txt = document.getElementById('gameoverText');
    if (txt) txt.innerHTML = '¡EL CONEJO ESCAPA! 🐰';
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
  boneTimer       = 0;
  heartSpawnTimer = 3;
  wolfIsJumping   = false;
  wolfJumpOff.v   = 0;
}

// ─── ITEMS LOGIC (Bones & Hearts) ──────────────────────────────────────────
var boneTimer = 0;
var heartSpawnTimer = 3;

function tickWolfItems(dt) {
  // Bones (Always spawn for wolf)
  if (!bone.mesh.visible) {
    boneTimer -= dt;
    if (boneTimer <= 0) {
      bone.mesh.visible = true;
      bone.angle = -floorRotation + Math.PI * 0.8;
      boneTimer = 2 + Math.random() * 3;
    }
  }

  // Hearts (Only if rabbit is at 1 life)
  if (heart && !heart.mesh.visible) {
    if (rabbitHits >= MAX_HITS - 1) {
      heartSpawnTimer -= dt;
      if (heartSpawnTimer <= 0) {
        heart.mesh.visible = true;
        heart.angle = -floorRotation + Math.PI * 0.8;
        heartSpawnTimer = 10 + Math.random() * 5;
      }
    } else {
      heartSpawnTimer = 3;
    }
  }
}

function healRabbit() {
  if (rabbitHits > 0) rabbitHits--;
  updateLivesDisplay();
}

function onOpponentConsume() { getMalus(); monsterPosTarget -= 0.07; }

var wolfJumpOff  = { v: 0 };
var wolfIsJumping = false;

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

function hideWolfObstacleUI() {
  // No longer used but kept for compatibility with other calls if any
}


// ─── LOOP UPDATE (llamado desde main.js) ─────────────────────────────────────
function updateWolfMode(dt) {
  if (!isMultiplayer) {
    rabbitAI.update(dt);
    tickWolfItems(dt);
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
  // Keydown for space
  document.addEventListener('keydown', function (e) {
    if (myRole !== 'wolf') return;
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); wolfJump(); }
  });
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────
function showWolfHint() {
  var h = document.getElementById('wolfHint');
  if (!h) {
    h = document.createElement('div');
    h.id = 'wolfHint';
    document.body.appendChild(h);
  }
  h.innerHTML = '🐺 CLICK = SALTAR &nbsp;|&nbsp; RECOGE HUESOS';
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
