/**
 * WOLF MODE MODULE
 */

var rabbitAI = {
  reactionDist : 0.75,
  jumpCooldown : 0,
  evasionBoost : 0,

  update: function (dt) {
    if (gameState.gameStatus !== 'play') return;
    this.jumpCooldown -= dt;

    var currentSpeedFactor = (gameState.speed / gameConfig.initSpeed);
    var adjustedReactionDist = this.reactionDist * (1 + (currentSpeedFactor - 1) * 0.1);

    var heroAngle  = Math.PI / 2;
    var obstAngle  = (gameState.floorRotation + obstacle.angle) % (Math.PI * 2);
    var carrotAngle = (gameState.floorRotation + carrot.angle) % (Math.PI * 2);

    var obstDiff   = Math.abs(heroAngle - obstAngle);
    if (obstDiff > Math.PI) obstDiff = Math.PI * 2 - obstDiff;

    var carrotDiff = Math.abs(heroAngle - carrotAngle);
    if (carrotDiff > Math.PI) carrotDiff = Math.PI * 2 - carrotDiff;

    if (obstacle.status !== 'flying' && obstDiff < adjustedReactionDist && this.jumpCooldown <= 0) {
      if (hero.status !== 'jumping') {
        hero.jump();
        this.jumpCooldown = 0.3;
      }
      return; 
    }

    var landingZoneObstAngle = (gameState.floorRotation + obstacle.angle + 0.3) % (Math.PI * 2); 
    var landingObstDiff = Math.abs(heroAngle - landingZoneObstAngle);
    if (landingObstDiff > Math.PI) landingObstDiff = Math.PI * 2 - landingObstDiff;

    if (carrotDiff < 0.4 && this.jumpCooldown <= 0 && landingObstDiff > 0.6) {
      if (hero.status !== 'jumping') {
        hero.jump();
        this.jumpCooldown = 0.5;
      }
    }

    if (gameState.proximity < 0.65) {
      this.evasionBoost += dt * 0.005;
      gameState.proximityTarget += this.evasionBoost;
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

var wolfAI = {
  reactionDist: 0.6,
  jumpCooldown: 0,
  
  update: function(dt) {
    if (gameState.gameStatus !== 'play') return;
    this.jumpCooldown -= dt;

    var monsterAngle = Math.PI / 2;
    var obstAngle = (gameState.floorRotation + obstacle.angle) % (Math.PI * 2);
    var boneAngle = (gameState.floorRotation + bone.angle) % (Math.PI * 2);

    var obstDiff = Math.abs(monsterAngle - obstAngle);
    if (obstDiff > Math.PI) obstDiff = Math.PI * 2 - obstDiff;

    var boneDiff = Math.abs(monsterAngle - boneAngle);
    if (boneDiff > Math.PI) boneDiff = Math.PI * 2 - boneDiff;

    // 1. Avoid Hedgehogs
    if (obstacle.status !== 'flying' && obstDiff < this.reactionDist && this.jumpCooldown <= 0) {
      if (!wolfIsJumping) {
        wolfJump();
        this.jumpCooldown = 0.5;
      }
      return;
    }

    // 2. Catch Bones (Wolf only needs to jump if it's too high, but AI jumps for flair/bonus)
    if (bone.mesh.visible && boneDiff < 0.3 && this.jumpCooldown <= 0) {
      if (!wolfIsJumping) {
        wolfJump();
        this.jumpCooldown = 0.7;
      }
    }
  },

  reset: function() {
    this.jumpCooldown = 0;
  }
};

// LIVES
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
  boneTimer       = 0;
  heartSpawnTimer = 3;
  wolfIsJumping   = false;
  wolfJumpOff.v   = 0;
}

// ITEMS LOGIC
var boneTimer = 0;
var heartSpawnTimer = 3;

function tickWolfItems(dt) {
  if (!bone.mesh.visible) {
    boneTimer -= dt;
    if (boneTimer <= 0) {
      bone.mesh.visible = true;
      bone.angle = -gameState.floorRotation + Math.PI * 0.8;
      boneTimer = 2 + Math.random() * 3;
    }
  }

  if (heart && !heart.mesh.visible) {
    if (rabbitHits >= MAX_HITS - 1) {
      heartSpawnTimer -= dt;
      if (heartSpawnTimer <= 0) {
        heart.mesh.visible = true;
        heart.angle = -gameState.floorRotation + Math.PI * 0.8;
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

function onOpponentConsume() { getMalus(); gameState.monsterPosTarget -= 0.07; }

var wolfJumpOff  = { v: 0 };
var wolfIsJumping = false;

function wolfJump() {
  if (gameState.gameStatus !== 'play') return;
  if (wolfIsJumping) return;
  wolfIsJumping = true;
  var spd = Math.max(0.35, 7 / Math.max(gameState.speed || 5, 1));
  TweenMax.killTweensOf(wolfJumpOff);
  TweenMax.to(wolfJumpOff, spd / 2, { v: 40, ease: Power2.easeOut });
  TweenMax.to(wolfJumpOff, spd / 2, {
    v: 0, ease: Power4.easeIn, delay: spd / 2,
    onComplete: function () { wolfIsJumping = false; }
  });
}

function updateWolfMode(dt) {
  if (!isMultiplayer) {
    if (myRole !== 'rabbit') {
      rabbitAI.update(dt);
    }
    if (myRole !== 'wolf') {
      wolfAI.update(dt);
    }
    tickWolfItems(dt);
  }
}

function setupWolfJumpControls() {
  document.addEventListener('keydown', function (e) {
    if (myRole !== 'wolf') return;
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); wolfJump(); }
  });
}

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

function _wolfPopup(id, text, color) {
  var el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = 'wolfPopup';
    document.body.appendChild(el);
  }
  el.innerHTML = text;
  if (color) el.style.background = color;
  else el.style.background = ''; // reset to CSS default if none provided
  el.style.display = 'block';
  el.style.opacity = '1';
  TweenMax.killTweensOf(el);
  TweenMax.set(el, { y: 0, scale: 1 });
  TweenMax.to(el, 0.12, { scale: 1.2 });
  TweenMax.to(el, 0.65, { opacity: 0, y: -45, scale: 1, delay: 0.2,
    onComplete: function () { el.style.display = 'none'; TweenMax.set(el, { y: 0 }); }
  });
}
