import * as THREE from 'three'
import GUI from 'lil-gui'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Tree } from '@dgreenheck/ez-tree'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement)
let controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window); // optional
controls.addEventListener('change', renderer);
controls.maxPolarAngle = Math.PI / 2;


// Create an axes helper with size 5
let axesHelper = new THREE.AxesHelper(5);

// Add the axes helper to the scene
scene.add(axesHelper);

camera.position.z = 25;
camera.position.y = 20;
camera.lookAt(new THREE.Vector3(0, 0, 0));
var state = {
  r1: 20,
  r2: 5,
  sides: 8,
  w: 3,
  spacing: 0.1,
  h: 0.2,
  y: 2,
  totalLength: 0
}

function getCirclePoint(i, r, sides) {
  const angle = (Math.PI * 2 / sides) * i;
  const x = Math.sin(angle) * r;
  const y = Math.cos(angle) * r;
  return new THREE.Vector2(x, y)
}
scene.background = new THREE.Color(0xa0a0a0);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);

scene.add(ambientLight, directionalLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

scene.fog = new THREE.Fog(0xa0a0a0, 30, 100);
const mesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false }));
mesh.rotation.x = - Math.PI / 2;
mesh.receiveShadow = true;
scene.add(mesh);
const material = new THREE.MeshLambertMaterial({ color: 0xdddddd });

const tree = new Tree();

// Set parameters
tree.options.bark.flatShading = true;
tree.options.bark.textured = false;
tree.options.leaves.textured = false;
tree.options.leaves.flatShading = true;
tree.options.leaves.color = 0xffffff;
tree.options.leaves.size = 0;
tree.options.branch.length[0] = 50
tree.options.branch.levels = 3;
tree.options.branch.radius[0] = 4;
tree.options.branch.radius[1] = 0.5;
// Generate tree and add to your Three.js scene
tree.generate();
scene.add(tree);

function buildScene(settings) {
  const r1 = settings.r1;
  const r2 = settings.r2;
  const sides = settings.sides;
  const w = settings.w;
  const spacing = settings.spacing;
  const h = settings.h;
  const yBench = settings.y;
  const meshes = [];
  const rd = r1 - r2;
  const c = Math.trunc(rd / (w + spacing));
  console.log(c);
  let totalLength = 0;
  const extrudeSettings = {
    steps: 1,
    depth: h,
    bevelEnabled: false,
    bevelThickness: 1,
    bevelSize: 1,
    bevelOffset: 0,
    bevelSegments: 10
  };

  for (let i = 0; i < sides; i++) {
    for (let y = 0; y < c; y++) {
      const shape = new THREE.Shape();
      const p1 = getCirclePoint(i, r2 + spacing + w * y, sides);
      shape.moveTo(p1.x, p1.y);
      const p2 = getCirclePoint(i, r2 + w * (y + 1), sides);
      shape.lineTo(p2.x, p2.y);
      const p3 = getCirclePoint(i + 1, r2 + w * (y + 1), sides)
      shape.lineTo(p3.x, p3.y);
      const p4 = getCirclePoint(i + 1, r2 + spacing + w * y, sides);
      shape.lineTo(p4.x, p4.y);
      shape.lineTo(p1.x, p1.y);
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = yBench;
      meshes.push(mesh);
      const l = p2.distanceTo(p3);
      //console.log(l);
      totalLength += l;
    }
  }
  state.totalLength = totalLength;
  return {
    meshes: meshes
  }
}

let object = buildScene(state);
addToScene(object);

for (const mesh of object.meshes) {
  scene.add(mesh)
}

function addToScene(o) {
  for (const mesh of o.meshes) {
    scene.add(mesh);
  }
}

function animate() {
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

const gui = new GUI();
gui.add(state, 'r1').min(1).max(100).onChange(value => {
  if (value <= state.r2) {
    state.r1 = state.r2;
  }
})
gui.add(state, 'r2').min(1).max(100).onChange(value => {
  if (value >= state.r1) {
    state.r2 = state.r1
  }
});
gui.add(state, 'sides').min(4).max(120).step(1);
gui.add(state, 'w').min(0).max(100)
gui.add(state, 'spacing').min(0).max(10);
gui.add(state, 'h').min(0.01).max(5);
gui.add(state, 'y').min(0.1).max(10);
gui.add(state, 'totalLength').listen().decimals(3).disable(true)
gui.onChange(event => {
  for (const mesh of object.meshes) {
    mesh.geometry.dispose();
    scene.remove(mesh);
  }
  console.log(event.object)
  object = buildScene(event.object);
  addToScene(object);
})

