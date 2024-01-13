//index.ts

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import axios from 'axios';

(window as any).newBox = newBox;
(window as any).newSphere = newSphere;
(window as any).newCylinder = newCylinder;
(window as any).newCastle = newCastle;

(window as any).save = save;
(window as any).load = load; // Add the "load" function


// CAMERA
let camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
camera.position.set(-35, 70, 100);
camera.lookAt(new THREE.Vector3(0, 0, 0));

// RENDERER
let renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// WINDOW RESIZE HANDLING
export function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// SCENE
let scene: THREE.Scene = new THREE.Scene()
scene.background = new THREE.Color(0xbfd1e5);

// CONTROLS
let controls = new OrbitControls(camera, renderer.domElement);

export function animate() {
  dragObject();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// ambient light
let hemiLight = new THREE.AmbientLight(0xffffff, 0.20);
scene.add(hemiLight);

//Add directional light
let dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-30, 50, -30);
scene.add(dirLight);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -70;
dirLight.shadow.camera.right = 70;
dirLight.shadow.camera.top = 70;
dirLight.shadow.camera.bottom = -70;

function createFloor() {
  let pos = { x: 0, y: -1, z: 3 };
  let scale = { x: 100, y: 2, z: 100 };

  let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(),
      new THREE.MeshPhongMaterial({ color: 0x9370DB }));
  blockPlane.position.set(pos.x, pos.y, pos.z);
  blockPlane.scale.set(scale.x, scale.y, scale.z);
  blockPlane.castShadow = true;
  blockPlane.receiveShadow = true;
  scene.add(blockPlane);

  blockPlane.userData.ground = true;
}

function createBox() {
  let size = 6;
  let scale = { x: 6, y: 6, z: 6 }
  let pos = { x: 15, y: scale.y / 2, z: 15 }

  let cube = new THREE.Mesh(new THREE.BoxBufferGeometry(size, size, size), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
  cube.position.set(pos.x, pos.y, pos.z);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);

  cube.userData.draggable = true;
  cube.userData.name = 'CUBE';
}

function createSphere() {
  let radius = 4;
  let pos = { x: 15, y: radius, z: -15 };

  let sphere = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 32, 32), 
      new THREE.MeshPhongMaterial({ color: 0x43a1f4 }))
  sphere.position.set(pos.x, pos.y, pos.z)
  sphere.castShadow = true
  sphere.receiveShadow = true
  scene.add(sphere)

  sphere.userData.draggable = true
  sphere.userData.name = 'SPHERE'
}

function createCylinder() {
  let radius = 4;
  let height = 6
  let pos = { x: -15, y: height / 2, z: 15 };

  // threejs
  let cylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(radius, radius, height, 32), new THREE.MeshPhongMaterial({ color: 0x90ee90 }))
  cylinder.position.set(pos.x, pos.y, pos.z)
  cylinder.castShadow = true
  cylinder.receiveShadow = true
  scene.add(cylinder)

  cylinder.userData.draggable = true
  cylinder.userData.name = 'CYLINDER'
}

function createCastle () {
  let objLoader = new OBJLoader();

  objLoader.loadAsync('./castle.obj').then((group) => {
    let castle = group.children[0];

    castle.position.x = -15
    castle.position.z = -15

    castle.scale.x = 5;
    castle.scale.y = 5;
    castle.scale.z = 5;

    castle.castShadow = true
    castle.receiveShadow = true

    castle.userData.draggable = true
    castle.userData.name = 'CASTLE'

    scene.add(castle)
  })
}
// Add this function to handle resizing of the selected object
function resizeObject(sizeMultiplier: number) {
  if (draggable != null) {
    draggable.scale.set(sizeMultiplier, sizeMultiplier, sizeMultiplier);
  }
}

// resize and delete
window.addEventListener('keydown', event => {
  let resizeSpeed = 0.1; // You can adjust the resize speed as needed

  let size = parseInt(event.key);
  if (!isNaN(size)) {
    resizeObject(size);
  } else if (event.key === 'Delete') {
    resizeObject(0);
  }
});

let raycaster = new THREE.Raycaster(); // create once
let clickMouse = new THREE.Vector2();  // create once
let moveMouse = new THREE.Vector2();   // create once
var draggable: THREE.Object3D;

function intersect(pos: THREE.Vector2) {
  raycaster.setFromCamera(pos, camera);
  return raycaster.intersectObjects(scene.children);
}

window.addEventListener('click', event => {
  if (draggable != null) {
    console.log(`dropping draggable ${draggable.userData.name}`)
    draggable = null as any
    return;
  }

  // THREE RAYCASTER
  clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  let found = intersect(clickMouse);
  if (found.length > 0) {
    if (found[0].object.userData.draggable) {
      draggable = found[0].object
      console.log(`found draggable ${draggable.userData.name}`)
    }
  }
})

window.addEventListener('mousemove', event => {
  moveMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  moveMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function dragObject() {
  if (draggable != null) {
    let found = intersect(moveMouse);
    if (found.length > 0) {
      for (let i = 0; i < found.length; i++) {
        if (!found[i].object.userData.ground)
          continue
        
        let target = found[i].point;
        draggable.position.x = target.x
        draggable.position.z = target.z
      }
    }
  }
}

// ...

function newBox() {
  let size = 6;

  let box = new THREE.Mesh(new THREE.BoxBufferGeometry(size, size, size), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
  box.position.set(0, size / 2, 0); // Set position to center of the plane
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);

  box.userData.draggable = true;
  box.userData.name = 'CUBE';
}

function newSphere() {
  let radius = 4;

  let sphere = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 32, 32), new THREE.MeshPhongMaterial({ color: 0x43a1f4 }))
  sphere.position.set(0, radius, 0); // Set position to center of the plane
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);

  sphere.userData.draggable = true;
  sphere.userData.name = 'SPHERE';
}

function newCylinder() {
  let radius = 4;
  let height = 6;

  let cylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(radius, radius, height, 32), new THREE.MeshPhongMaterial({ color: 0x90ee90 }))
  cylinder.position.set(0, height / 2, 0); // Set position to center of the plane
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  scene.add(cylinder);

  console.log(scene);

  cylinder.userData.draggable = true;
  cylinder.userData.name = 'CYLINDER';
}

function newCastle() {
  let objLoader = new OBJLoader();

  objLoader.loadAsync('./castle.obj').then((group) => {
    let castle = group.children[0];

    castle.position.x = 0;
    castle.position.z = 0;

    castle.scale.x = 5;
    castle.scale.y = 5;
    castle.scale.z = 5;

    castle.castShadow = true;
    castle.receiveShadow = true;

    castle.userData.draggable = true;
    castle.userData.name = 'CASTLE';

    scene.add(castle);
  })
}

// let iniScene = scene



function save( ) {

  console.log(scene.toJSON());

  let currentUrl = window.location.href;
  console.log(currentUrl);
  let params = new URLSearchParams(currentUrl.split("?")[1]);
  let username = params.get("username");
  let password = params.get("password");

// Make POST request 
axios.post('https://mernback-9dei.onrender.com/data', {
  username: username,
  password: password,
  threed:  JSON.stringify(scene.toJSON())
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.log('error no response!', error); 
});

 console.log(username, password, scene)
}

function load() {
     let currentUrl = window.location.href;
     let params = new URLSearchParams(currentUrl.split("?")[1]);
     let username = params.get("username");
     let password = params.get("password");
    
     // Make GET request
     axios.get('https://mernback-9dei.onrender.com/threed', {
      params: {
       username: username,
       password: password
      }
     })
     .then(response => {
      let threed = response.data;
      console.log('kirebada',threed);
      
    // Clear the scene
    scene.clear();
    // scene = iniScene;

    let loader = new THREE.ObjectLoader();
    scene.add(loader.parse(threed));
    
    })
     .catch(error => {
      console.log('error retrieving threed data!', error);
     });
    }

createFloor()
createBox()
createSphere()
createCylinder()
createCastle()

save()

animate()
