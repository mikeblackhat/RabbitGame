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
    // The hero sits at a fixed world position; we track the obstacle's angle
    // relative to the "top" of the circular floor (~PI/2 = collectible zone).
    var heroPosAngle = Math.PI * 0.75;
    var obstAngle    = (floorRotation + obstacle.angle) % (Math.PI * 2);
    var angleDiff    = Math.abs(heroPosAngle - obstAngle);
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

    if (obstacle.status !== 'flying' && angleDiff < this.reactionDistance && this.jumpCooldown <= 0) {
      if (hero.status !== 'jumping') {
        hero.jump();
        // Slightly randomised cooldown so the AI feels human-like
        this.jumpCooldown = 0.7 + Math.random() * 0.5;
      }
    }

    // ── Jump for carrot ─────────────────────────────────────────────────────
    // Carrots orbit at floorRadius+50. They are collectible when near the top
    // of the circle (angle ≈ π/2 in world space). The hero must jump (y ≈ 45)
    // to reach them there.
    var carrotWorldAngle = (floorRotation + carrot.angle) % (Math.PI * 2);
    var carrotApproach   = Math.abs(carrotWorldAngle - Math.PI / 2);
    if (carrotApproach > Math.PI) carrotApproach = Math.PI * 2 - carrotApproach;

    if (carrotApproach < 0.38 && this.jumpCooldown <= 0) {
      if (hero.status !== 'jumping') {
        hero.jump();
        this.jumpCooldown = 1.2;
      }
    }

    // ── Evasion burst when wolf is very close ───────────────────────────────
    if (monsterPos > 0.62) {
      this.evasionBoost += dt * 0.001;
      monsterPosTarget  += this.evasionBoost;
      this.evasionBoost  = Math.min(this.evasionBoost, 0.003);
    } else {
      this.evasionBoost = 0;
    }
  },

  reset: function () {
    this.jumpCooldown = 0;
    this.evasionBoost = 0;
  }
};

// ─── WOLF BITE COOLDOWN ───────────────────────────────────────────────────────
var wolfBiteCooldown = 0;

/**
 * Called every frame from the main loop when myRole === 'wolf'.
 * Decrements the bite cooldown and (in solo mode) runs the rabbit AI.
 */
function updateWolfMode(dt) {
  if (wolfBiteCooldown > 0) wolfBiteCooldown -= dt;
  if (!isMultiplayer) rabbitAI.update(dt);
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
  wolfBiteCooldown = 1.2;                    // 1.2 s before next bite
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

  // Wolf gains a speed burst — push the monster position forward
  monsterPosTarget += 0.08;
  if (monsterPosTarget > 0.74) monsterPosTarget = 0.74;   // cap: can't skip past rabbit

  showWolfEatFeedback();
  playBonusSound();

  if (isMultiplayer) sendData({ type: 'consumeObstacle' });
}

/** Called on the RABBIT side when the wolf (online) ate the hedgehog */
function onOpponentConsume() {
  getMalus();
  monsterPosTarget += 0.08;
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
