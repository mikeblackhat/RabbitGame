var fieldGameOver, fieldDistance;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH, windowHalfX, windowHalfY,
  mousePos = {
    x: 0,
    y: 0
  };

//3D OBJECTS VARIABLES

var hero;


// Materials
var blackMat = new THREE.MeshPhongMaterial({
  color: 0x100707,
  shading: THREE.FlatShading,
});

var brownMat = new THREE.MeshPhongMaterial({
  color: 0xb44b39,
  shininess: 0,
  shading: THREE.FlatShading,
});

var greenMat = new THREE.MeshPhongMaterial({
  color: 0x7abf8e,
  shininess: 0,
  shading: THREE.FlatShading,
});

var pinkMat = new THREE.MeshPhongMaterial({
  color: 0xdc5f45,//0xb43b29,//0xff5b49,
  shininess: 0,
  shading: THREE.FlatShading,
});

var lightBrownMat = new THREE.MeshPhongMaterial({
  color: 0xe07a57,
  shading: THREE.FlatShading,
});

var whiteMat = new THREE.MeshPhongMaterial({
  color: 0xa49789,
  shading: THREE.FlatShading,
});
var skinMat = new THREE.MeshPhongMaterial({
  color: 0xff9ea5,
  shading: THREE.FlatShading
});

// Wolf obstacle hedgehog materials (purple / indigo theme)
var wolfSpikeMat = new THREE.MeshPhongMaterial({
  color: 0x6a11cb,
  shading: THREE.FlatShading,
});
var wolfBodyMat = new THREE.MeshPhongMaterial({
  color: 0x2575fc,
  shading: THREE.FlatShading,
});
var wolfHeadMat = new THREE.MeshPhongMaterial({
  color: 0x9b5de5,
  shading: THREE.FlatShading,
});



// OTHER VARIABLES

var PI = Math.PI;

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function initScreenAnd3D() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  scene = new THREE.Scene();

  scene.fog = new THREE.Fog(0xd6eae6, 160, 350);

  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = 1;
  farPlane = 2000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.x = 0;
  camera.position.z = cameraPosGame;
  camera.position.y = 30;
  camera.lookAt(new THREE.Vector3(0, 30, 0));

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(malusClearColor, malusClearAlpha);

  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
  document.addEventListener('mousedown', handleMouseDown, false);
  document.addEventListener("touchstart", handleMouseDown, { passive: false });

  /*
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  //controls.minPolarAngle = -Math.PI / 2; 
  //controls.maxPolarAngle = Math.PI / 2;
  //controls.noZoom = true;
  controls.noPan = true;
  //*/

  clock = new THREE.Clock();
  handleWindowResize();
}

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;

  // High impact adjustment for portrait mode
  if (camera.aspect < 1) {
    // Zoom in FOV slightly but also move camera back to keep perspective
    camera.fov = fieldOfView / (camera.aspect * 0.8);
    camera.position.z = cameraPosGame * 1.5;
  } else {
    camera.fov = fieldOfView;
    camera.position.z = cameraPosGame;
  }

  // Push fog way back so it doesn't wash out the scene on mobile
  var fogNear = 200;
  var fogFar = 800;
  if (camera.aspect < 1) {
    fogNear = 400;
    fogFar = 1000;
  }

  if (scene.fog) {
    scene.fog.near = fogNear;
    scene.fog.far = fogFar;
  }

  camera.updateProjectionMatrix();
}

function handleMouseDown(event) {
  if (event.type === 'touchstart') {
    event.preventDefault();
  }
  
  if (gameState.gameStatus === "play") {
    if (typeof myRole !== 'undefined' && myRole === 'wolf') {
      wolfJump();
    } else {
      hero.jump();
    }
  } else if (gameState.gameStatus === "readyToReplay") {
    replay();
  }
}
