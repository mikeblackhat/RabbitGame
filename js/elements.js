BonusParticles = function () {
  this.mesh = new THREE.Group();
  var bigParticleGeom = new THREE.CubeGeometry(10, 10, 10, 1);
  var smallParticleGeom = new THREE.CubeGeometry(5, 5, 5, 1);
  this.parts = [];
  for (var i = 0; i < 10; i++) {
    var partPink = new THREE.Mesh(bigParticleGeom, pinkMat);
    var partGreen = new THREE.Mesh(smallParticleGeom, greenMat);
    partGreen.scale.set(.5, .5, .5);
    this.parts.push(partPink);
    this.parts.push(partGreen);
    this.mesh.add(partPink);
    this.mesh.add(partGreen);
  }
}

BonusParticles.prototype.explose = function () {
  var _this = this;
  var explosionSpeed = .5;
  for (var i = 0; i < this.parts.length; i++) {
    var tx = -50 + Math.random() * 100;
    var ty = -50 + Math.random() * 100;
    var tz = -50 + Math.random() * 100;
    var p = this.parts[i];
    p.position.set(0, 0, 0);
    p.scale.set(1, 1, 1);
    p.visible = true;
    var s = explosionSpeed + Math.random() * .5;
    TweenMax.to(p.position, s, { x: tx, y: ty, z: tz, ease: Power4.easeOut });
    TweenMax.to(p.scale, s, { x: .01, y: .01, z: .01, ease: Power4.easeOut, onComplete: removeParticle, onCompleteParams: [p] });
  }
}

Carrot = function () {
  this.angle = 0;
  this.mesh = new THREE.Group();

  var bodyGeom = new THREE.CylinderGeometry(5, 3, 10, 4, 1);
  bodyGeom.vertices[8].y += 2;
  bodyGeom.vertices[9].y -= 3;

  this.body = new THREE.Mesh(bodyGeom, pinkMat);

  var leafGeom = new THREE.CubeGeometry(5, 10, 1, 1);
  leafGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 5, 0));
  leafGeom.vertices[2].x -= 1;
  leafGeom.vertices[3].x -= 1;
  leafGeom.vertices[6].x += 1;
  leafGeom.vertices[7].x += 1;

  this.leaf1 = new THREE.Mesh(leafGeom, greenMat);
  this.leaf1.position.y = 7;
  this.leaf1.rotation.z = .3;
  this.leaf1.rotation.x = .2;

  this.leaf2 = this.leaf1.clone();
  this.leaf2.scale.set(1, 1.3, 1);
  this.leaf2.position.y = 7;
  this.leaf2.rotation.z = -.3;
  this.leaf2.rotation.x = -.2;

  this.mesh.add(this.body);
  this.mesh.add(this.leaf1);
  this.mesh.add(this.leaf2);

  this.body.traverse(function (object) {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

Carrot.prototype.update = function(delta, floorRotation) {
  this.mesh.rotation.y += delta * 6;
  this.mesh.rotation.z = Math.PI / 2 - (floorRotation + this.angle);
  this.mesh.position.y = -gameConfig.floorRadius + Math.sin(floorRotation + this.angle) * (gameConfig.floorRadius + 50);
  this.mesh.position.x = Math.cos(floorRotation + this.angle) * (gameConfig.floorRadius + 50);

  // Auto-respawn if passed behind camera
  if (floorRotation + this.angle > 3.0) {
    this.angle = -floorRotation - 0.2 - Math.random() * 0.5;
  }
}

Hedgehog = function () {
  this.angle = 0;
  this.status = "ready";
  this.mesh = new THREE.Group();
  var bodyGeom = new THREE.CubeGeometry(6, 6, 6, 1);
  this.body = new THREE.Mesh(bodyGeom, blackMat);

  var headGeom = new THREE.CubeGeometry(5, 5, 7, 1);
  this.head = new THREE.Mesh(headGeom, lightBrownMat);
  this.head.position.z = 6;
  this.head.position.y = -.5;

  var noseGeom = new THREE.CubeGeometry(1.5, 1.5, 1.5, 1);
  this.nose = new THREE.Mesh(noseGeom, blackMat);
  this.nose.position.z = 4;
  this.nose.position.y = 2;

  var eyeGeom = new THREE.CubeGeometry(1, 3, 3);

  this.eyeL = new THREE.Mesh(eyeGeom, whiteMat);
  this.eyeL.position.x = 2.2;
  this.eyeL.position.z = -.5;
  this.eyeL.position.y = .8;
  this.eyeL.castShadow = true;
  this.head.add(this.eyeL);

  var irisGeom = new THREE.CubeGeometry(.5, 1, 1);

  this.iris = new THREE.Mesh(irisGeom, blackMat);
  this.iris.position.x = .5;
  this.iris.position.y = .8;
  this.iris.position.z = .8;
  this.eyeL.add(this.iris);

  this.eyeR = this.eyeL.clone();
  this.eyeR.children[0].position.x = -this.iris.position.x;
  this.eyeR.position.x = -this.eyeL.position.x;

  var spikeGeom = new THREE.CubeGeometry(.5, 2, .5, 1);
  spikeGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 1, 0));

  for (var i = 0; i < 9; i++) {
    var row = (i % 3);
    var col = Math.floor(i / 3);
    var sb = new THREE.Mesh(spikeGeom, blackMat);
    sb.rotation.x = -Math.PI / 2 + (Math.PI / 12 * row) - .5 + Math.random();
    sb.position.z = -3;
    sb.position.y = -2 + row * 2;
    sb.position.x = -2 + col * 2;
    this.body.add(sb);
    var st = new THREE.Mesh(spikeGeom, blackMat);
    st.position.y = 3;
    st.position.x = -2 + row * 2;
    st.position.z = -2 + col * 2;
    st.rotation.z = Math.PI / 6 - (Math.PI / 6 * row) - .5 + Math.random();
    this.body.add(st);

    var sr = new THREE.Mesh(spikeGeom, blackMat);
    sr.position.x = 3;
    sr.position.y = -2 + row * 2;
    sr.position.z = -2 + col * 2;
    sr.rotation.z = -Math.PI / 2 + (Math.PI / 12 * row) - .5 + Math.random();
    this.body.add(sr);

    var sl = new THREE.Mesh(spikeGeom, blackMat);
    sl.position.x = -3;
    sl.position.y = -2 + row * 2;
    sl.position.z = -2 + col * 2;
    sl.rotation.z = Math.PI / 2 - (Math.PI / 12 * row) - .5 + Math.random();;
    this.body.add(sl);
  }

  this.head.add(this.eyeR);
  var earGeom = new THREE.CubeGeometry(2, 2, .5, 1);
  this.earL = new THREE.Mesh(earGeom, lightBrownMat);
  this.earL.position.x = 2.5;
  this.earL.position.z = -2.5;
  this.earL.position.y = 2.5;
  this.earL.rotation.z = -Math.PI / 12;
  this.earL.castShadow = true;
  this.head.add(this.earL);

  this.earR = this.earL.clone();
  this.earR.position.x = -this.earL.position.x;
  this.earR.rotation.z = -this.earL.rotation.z;
  this.earR.castShadow = true;
  this.head.add(this.earR);

  var mouthGeom = new THREE.CubeGeometry(1, 1, .5, 1);
  this.mouth = new THREE.Mesh(mouthGeom, blackMat);
  this.mouth.position.z = 3.5;
  this.mouth.position.y = -1.5;
  this.head.add(this.mouth);


  this.mesh.add(this.body);
  this.body.add(this.head);
  this.head.add(this.nose);

  this.mesh.traverse(function (object) {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

Hedgehog.prototype.nod = function () {
  var _this = this;
  var speed = .1 + Math.random() * .5;
  var angle = -Math.PI / 4 + Math.random() * Math.PI / 2;
  TweenMax.to(this.head.rotation, speed, {
    y: angle, onComplete: function () {
      _this.nod();
    }
  });
}

// ─── BONE (for the wolf) ─────────────────────────────────────────────────────
Bone = function () {
  this.angle = 0;
  this.mesh = new THREE.Group();

  var bodyGeom = new THREE.CylinderGeometry(2, 2, 12, 6, 1);
  this.body = new THREE.Mesh(bodyGeom, whiteMat);
  this.body.rotation.z = Math.PI/2;

  var knobGeom = new THREE.CylinderGeometry(3, 3, 4, 6, 1);
  
  this.knob1 = new THREE.Mesh(knobGeom, whiteMat);
  this.knob1.position.x = -6;
  this.knob1.position.y = 2;
  this.knob1.rotation.z = Math.PI/2;

  this.knob2 = this.knob1.clone();
  this.knob2.position.y = -2;

  this.knob3 = this.knob1.clone();
  this.knob3.position.x = 6;

  this.knob4 = this.knob2.clone();
  this.knob4.position.x = 6;

  this.mesh.add(this.body);
  this.mesh.add(this.knob1);
  this.mesh.add(this.knob2);
  this.mesh.add(this.knob3);
  this.mesh.add(this.knob4);

  this.mesh.traverse(function (object) {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}


// ─── WOLF HEDGEHOG (same geometry, purple/blue palette) ───────────────────────
WolfHedgehog = function () {
  this.angle = 0;
  this.status = "ready";
  this.mesh = new THREE.Group();

  var bodyGeom = new THREE.CubeGeometry(6, 6, 6, 1);
  this.body = new THREE.Mesh(bodyGeom, wolfBodyMat);

  var headGeom = new THREE.CubeGeometry(5, 5, 7, 1);
  this.head = new THREE.Mesh(headGeom, wolfHeadMat);
  this.head.position.z = 6;
  this.head.position.y = -.5;

  var noseGeom = new THREE.CubeGeometry(1.5, 1.5, 1.5, 1);
  this.nose = new THREE.Mesh(noseGeom, wolfSpikeMat);
  this.nose.position.z = 4;
  this.nose.position.y = 2;

  var eyeGeom = new THREE.CubeGeometry(1, 3, 3);
  this.eyeL = new THREE.Mesh(eyeGeom, whiteMat);
  this.eyeL.position.x = 2.2;
  this.eyeL.position.z = -.5;
  this.eyeL.position.y = .8;
  this.head.add(this.eyeL);

  var irisGeom = new THREE.CubeGeometry(.5, 1, 1);
  this.iris = new THREE.Mesh(irisGeom, wolfSpikeMat);
  this.iris.position.x = .5;
  this.iris.position.y = .8;
  this.iris.position.z = .8;
  this.eyeL.add(this.iris);

  this.eyeR = this.eyeL.clone();
  this.eyeR.children[0].position.x = -this.iris.position.x;
  this.eyeR.position.x = -this.eyeL.position.x;

  var spikeGeom = new THREE.CubeGeometry(.5, 2, .5, 1);
  spikeGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 1, 0));

  for (var i = 0; i < 9; i++) {
    var row = (i % 3);
    var col = Math.floor(i / 3);
    var sb = new THREE.Mesh(spikeGeom, wolfSpikeMat);
    sb.rotation.x = -Math.PI / 2 + (Math.PI / 12 * row) - .5 + Math.random();
    sb.position.z = -3;
    sb.position.y = -2 + row * 2;
    sb.position.x = -2 + col * 2;
    this.body.add(sb);
    var st = new THREE.Mesh(spikeGeom, wolfSpikeMat);
    st.position.y = 3;
    st.position.x = -2 + row * 2;
    st.position.z = -2 + col * 2;
    st.rotation.z = Math.PI / 6 - (Math.PI / 6 * row) - .5 + Math.random();
    this.body.add(st);
    var sr = new THREE.Mesh(spikeGeom, wolfSpikeMat);
    sr.position.x = 3;
    sr.position.y = -2 + row * 2;
    sr.position.z = -2 + col * 2;
    sr.rotation.z = -Math.PI / 2 + (Math.PI / 12 * row) - .5 + Math.random();
    this.body.add(sr);
    var sl = new THREE.Mesh(spikeGeom, wolfSpikeMat);
    sl.position.x = -3;
    sl.position.y = -2 + row * 2;
    sl.position.z = -2 + col * 2;
    sl.rotation.z = Math.PI / 2 - (Math.PI / 12 * row) - .5 + Math.random();
    this.body.add(sl);
  }

  this.head.add(this.eyeR);
  var earGeom = new THREE.CubeGeometry(2, 2, .5, 1);
  this.earL = new THREE.Mesh(earGeom, wolfHeadMat);
  this.earL.position.x = 2.5;
  this.earL.position.z = -2.5;
  this.earL.position.y = 2.5;
  this.earL.rotation.z = -Math.PI / 12;
  this.head.add(this.earL);

  this.earR = this.earL.clone();
  this.earR.position.x = -this.earL.position.x;
  this.earR.rotation.z = -this.earL.rotation.z;
  this.head.add(this.earR);

  var mouthGeom = new THREE.CubeGeometry(1, 1, .5, 1);
  this.mouth = new THREE.Mesh(mouthGeom, wolfSpikeMat);
  this.mouth.position.z = 3.5;
  this.mouth.position.y = -1.5;
  this.head.add(this.mouth);

  this.mesh.add(this.body);
  this.body.add(this.head);
  this.head.add(this.nose);

  this.mesh.traverse(function (object) {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

LifeHeart = function () {
  this.angle = 0;
  this.mesh = new THREE.Group();

  var heartShape = new THREE.Shape();
  heartShape.moveTo( 0, 0 );
  heartShape.bezierCurveTo( 0, -3, -5, -3, -5, 0 );
  heartShape.bezierCurveTo( -5, 3, 0, 5, 0, 10 );
  heartShape.bezierCurveTo( 0, 5, 5, 3, 5, 0 );
  heartShape.bezierCurveTo( 5, -3, 0, -3, 0, 0 );

  var extrudeSettings = { amount: 2, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
  var geometry = new THREE.ExtrudeGeometry( heartShape, extrudeSettings );
  
  // Use pinkMat or similar red-ish material
  this.body = new THREE.Mesh(geometry, pinkMat); 
  this.body.rotation.z = Math.PI;
  this.body.scale.set(0.6, 0.6, 0.6);

  this.mesh.add(this.body);

  this.mesh.traverse(function (object) {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

WolfHedgehog.prototype.nod = function () {
  var _this = this;
  var speed = .1 + Math.random() * .5;
  var angle = -Math.PI / 4 + Math.random() * Math.PI / 2;
  TweenMax.to(this.head.rotation, speed, {
    y: angle, onComplete: function () { _this.nod(); }
  });
}

Hedgehog.prototype.update = function(delta, floorRotation) {
  if (this.status == "flying") return;

  if (floorRotation + this.angle > 3.0) {
    // Increased randomness: from 0.1 to 1.2 radians gap
    this.angle = -floorRotation - 0.1 - Math.random() * 1.1;
    this.body.rotation.y = Math.random() * Math.PI * 2;
  }

  this.mesh.rotation.z = floorRotation + this.angle - Math.PI / 2;
  this.mesh.position.y = -gameConfig.floorRadius + Math.sin(floorRotation + this.angle) * (gameConfig.floorRadius + 3);
  this.mesh.position.x = Math.cos(floorRotation + this.angle) * (gameConfig.floorRadius + 3);
}

Bone.prototype.update = function(delta, floorRotation) {
  if (!this.mesh.visible) return;
  this.mesh.rotation.y += delta * 6;
  this.mesh.rotation.z = Math.PI / 2 - (floorRotation + this.angle);
  this.mesh.position.y = -gameConfig.floorRadius + Math.sin(floorRotation + this.angle) * (gameConfig.floorRadius + 30);
  this.mesh.position.x = Math.cos(floorRotation + this.angle) * (gameConfig.floorRadius + 30);

  // Deactivate if passed behind camera
  if (floorRotation + this.angle > 3.0) {
    this.mesh.visible = false;
  }
}

LifeHeart.prototype.update = function(delta, floorRotation) {
  if (!this.mesh.visible) return;
  this.mesh.rotation.y += delta * 6;
  this.mesh.rotation.z = Math.PI / 2 - (floorRotation + this.angle);
  this.mesh.position.y = -gameConfig.floorRadius + Math.sin(floorRotation + this.angle) * (gameConfig.floorRadius + 40);
  this.mesh.position.x = Math.cos(floorRotation + this.angle) * (gameConfig.floorRadius + 40);

  // Deactivate if passed behind camera
  if (floorRotation + this.angle > 3.0) {
    this.mesh.visible = false;
  }
}

function removeParticle(p) {
  p.visible = false;
}

