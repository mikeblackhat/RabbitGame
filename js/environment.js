function createLights() {
  globalLight = new THREE.AmbientLight(0xffffff, .9);

  shadowLight = new THREE.DirectionalLight(0xffffff, 1);
  shadowLight.position.set(-30, 40, 20);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 2000;
  shadowLight.shadow.mapSize.width = shadowLight.shadow.mapSize.height = 2048;

  scene.add(globalLight);
  scene.add(shadowLight);

}

function createFloor() {

  floorShadow = new THREE.Mesh(new THREE.SphereGeometry(floorRadius, 50, 50), new THREE.MeshPhongMaterial({
    color: 0x7abf8e,
    specular: 0x000000,
    shininess: 1,
    transparent: true,
    opacity: .5
  }));
  //floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.receiveShadow = true;

  floorGrass = new THREE.Mesh(new THREE.SphereGeometry(floorRadius - .5, 50, 50), new THREE.MeshBasicMaterial({
    color: 0x7abf8e
  }));
  //floor.rotation.x = -Math.PI / 2;
  floorGrass.receiveShadow = false;

  floor = new THREE.Group();
  floor.position.y = -floorRadius;

  floor.add(floorShadow);
  floor.add(floorGrass);
  scene.add(floor);

}

function createHero() {
  hero = new Hero();
  hero.mesh.rotation.y = Math.PI / 2;
  
  heroHolder = new THREE.Group();
  heroHolder.add(hero.mesh);
  scene.add(heroHolder);
  
  hero.nod();
}

function createMonster() {

  monster = new Monster();
  monster.mesh.position.z = 0;
  //monster.mesh.scale.set(1.2,1.2,1.2);
  scene.add(monster.mesh);
  updateMonsterPosition();

}

var firs = new THREE.Group();

function createFirs() {

  var nTrees = 100;
  for (var i = 0; i < nTrees; i++) {
    var phi = i * (Math.PI * 2) / nTrees;
    var theta = Math.PI / 2;
    //theta += .25 + Math.random()*.3; 
    theta += (Math.random() > .05) ? .25 + Math.random() * .3 : - .35 - Math.random() * .1;

    var fir = new Tree();
    fir.mesh.position.x = Math.sin(theta) * Math.cos(phi) * floorRadius;
    fir.mesh.position.y = Math.sin(theta) * Math.sin(phi) * (floorRadius - 10);
    fir.mesh.position.z = Math.cos(theta) * floorRadius;

    var vec = fir.mesh.position.clone();
    var axis = new THREE.Vector3(0, 1, 0);
    fir.mesh.quaternion.setFromUnitVectors(axis, vec.clone().normalize());
    floor.add(fir.mesh);
  }
}

function createCarrot() {
  carrot = new Carrot();
  scene.add(carrot.mesh);
}

function createObstacle() {
  obstacle = new Hedgehog();
  obstacle.body.rotation.y = -Math.PI / 2;
  obstacle.mesh.scale.set(1.1, 1.1, 1.1);
  obstacle.mesh.position.y = floorRadius + 4;
  obstacle.nod();
  scene.add(obstacle.mesh);
}

function createBonusParticles() {
  bonusParticles = new BonusParticles();
  bonusParticles.mesh.visible = false;
  scene.add(bonusParticles.mesh);
}

function createWolfObstacle() {
  wolfObstacle = new WolfHedgehog();
  wolfObstacle.body.rotation.y = -Math.PI / 2;
  wolfObstacle.mesh.scale.set(1.1, 1.1, 1.1);
  wolfObstacle.mesh.position.y = floorRadius + 4;
  wolfObstacle.mesh.visible = false;   
  wolfObstacle.nod();
  scene.add(wolfObstacle.mesh);
}

function createBone() {
  bone = new Bone();
  bone.mesh.visible = false;
  scene.add(bone.mesh);
}

function createHeart() {
  heart = new LifeHeart();
  heart.mesh.visible = false;
  scene.add(heart.mesh);
}
