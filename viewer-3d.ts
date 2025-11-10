import { FPS, PREFIX, X_STEPS, Y_STEPS, generateSteps } from './constants.js';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PlaneGeometry,
  MeshStandardMaterial,
  Mesh,
  AmbientLight,
  TextureLoader,
  DoubleSide,
  SRGBColorSpace,
  CanvasTexture,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { activePhoto } from './photos.js';


const DEFAULT_DISPLACEMENT_SCALE = 0.5;
const {steps, PREFIX, X_STEPS, Y_STEPS} = generateSteps(activePhoto);

// Create container for 3D viewer
const viewerContainer = document.createElement('div');
viewerContainer.className = 'viewer-3d-container';
document.body.appendChild(viewerContainer);

// Setup Three.js scene
function setupScene() {
  const canvasEl = document.createElement('canvas');
  canvasEl.classList.add('viewer-3d');

  const width = 800;
  const height = 800;

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, width / height, 0.01, 10);
  camera.position.z = 2;
  scene.add(camera);

  const renderer = new WebGLRenderer({ canvas: canvasEl, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  const light = new AmbientLight(0xffffff, 2);
  scene.add(light);

  // Create material for the plane
  const material = new MeshStandardMaterial({
    side: DoubleSide,
    displacementScale: DEFAULT_DISPLACEMENT_SCALE,
  });

  // Create geometry with high detail for displacement
  const geometry = new PlaneGeometry(1, 1, 512, 512);
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);

  // Add orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Animation loop
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
    controls.update();
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = viewerContainer.offsetWidth / viewerContainer.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewerContainer.offsetWidth, viewerContainer.offsetHeight);
  });

  return { canvas: canvasEl, material, mesh };
}

// Preload all textures
const textureLoader = new TextureLoader();
const photoTextures: Map<string, any> = new Map();
const depthTextures: Map<string, any> = new Map();

async function preloadTextures() {
  const allSteps = steps.flat();
  console.log(`Preloading ${allSteps.length} textures...`);

  // Load in batches to avoid overwhelming the browser
  const batchSize = 10;
  for (let i = 0; i < allSteps.length; i += batchSize) {
    const batch = allSteps.slice(i, i + batchSize);
    await Promise.all(batch.map(async (step) => {
      const photoPath = `./outputs/${PREFIX}/${step.filename}`;
      const depthPath = `./outputs/${PREFIX}/depth/${step.filename}.depth.png`;

      return new Promise((resolve) => {
        // Load photo texture
        textureLoader.load(photoPath, (texture) => {
          texture.colorSpace = SRGBColorSpace;
          photoTextures.set(step.filename, texture);

          // Load depth texture
          textureLoader.load(depthPath, (depthTexture) => {
            depthTextures.set(step.filename, depthTexture);
            resolve(true);
          }, undefined, () => {
            // If depth map doesn't exist, just resolve
            console.warn(`Depth map not found: ${depthPath}`);
            resolve(true);
          });
        });
      });
    }));

    console.log(`Loaded ${Math.min(i + batchSize, allSteps.length)} / ${allSteps.length}`);
  }

  console.log('All textures loaded!');
}

// Initialize scene
const { canvas, material } = setupScene();
viewerContainer.appendChild(canvas);

// Preload textures
await preloadTextures();

// Track mouse movement and update 3D view
let lastFrameTime = 0;
let currentXIndex = Math.floor(X_STEPS / 2);
let currentYIndex = Math.floor(Y_STEPS / 2);

// Set initial texture
const initialStep = steps[currentYIndex][currentXIndex];
if (photoTextures.has(initialStep.filename)) {
  material.map = photoTextures.get(initialStep.filename);
  material.displacementMap = depthTextures.get(initialStep.filename);
  material.needsUpdate = true;
}

document.addEventListener('mousemove', (e) => {
  // Throttle to match video FPS for smoother playback
  const now = performance.now();
  if (now - lastFrameTime < 1000 / FPS) {
    return;
  }
  lastFrameTime = now;

  // Calculate container center position
  const containerRect = viewerContainer.getBoundingClientRect();
  const containerCenterX = containerRect.left + containerRect.width / 2;
  const containerCenterY = containerRect.top + containerRect.height / 2;

  // Calculate direction from container center to mouse
  const containerDeltaX = e.clientX - containerCenterX;
  const containerDeltaY = e.clientY - containerCenterY;

  // Normalize based on container dimensions
  const maxDistanceX = containerRect.width / 2;
  const maxDistanceY = containerRect.height / 2;
  const containerNormalizedX = Math.max(-1, Math.min(1, containerDeltaX / maxDistanceX));
  const containerNormalizedY = Math.max(-1, Math.min(1, containerDeltaY / maxDistanceY));

  // Map to indices
  const xIndex = Math.round(((containerNormalizedX + 1) / 2) * (X_STEPS - 1));
  const yIndex = Math.round(((containerNormalizedY + 1) / 2) * (Y_STEPS - 1));

  // Only update if indices changed
  if (xIndex !== currentXIndex || yIndex !== currentYIndex) {
    currentXIndex = xIndex;
    currentYIndex = yIndex;

    const step = steps[yIndex][xIndex];

    // Update textures
    if (photoTextures.has(step.filename)) {
      material.map = photoTextures.get(step.filename);
      material.displacementMap = depthTextures.get(step.filename);
      material.needsUpdate = true;
    }
  }
});

// Add displacement scale control
const depthControl = document.createElement('input');
depthControl.type = 'range';
depthControl.min = '0';
depthControl.max = '5';
depthControl.step = '0.1';
depthControl.value = DEFAULT_DISPLACEMENT_SCALE.toString();
depthControl.className = 'depth-control';

const depthLabel = document.createElement('label');
// depthLabel.textContent = 'Depth: ';
depthLabel.appendChild(depthControl);
viewerContainer.appendChild(depthLabel);

depthControl.addEventListener('input', (e) => {
  const value = parseFloat((e.target as HTMLInputElement).value);
  material.displacementScale = value;
  material.needsUpdate = true;
});

export {};

