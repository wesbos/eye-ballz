import { FPS, generateSteps } from './constants.js';
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
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { photos, Photo } from './photos.js';

const DEFAULT_DISPLACEMENT_SCALE = 0.5;

// State management
let currentPhoto: Photo;
let PREFIX: string;
let Y_STEPS: number;
let X_STEPS: number;
let steps: ReturnType<typeof generateSteps>['steps'];

// DOM elements
const viewerContainer = document.createElement('div');
viewerContainer.className = 'viewer-3d-container';
document.body.appendChild(viewerContainer);

// Three.js references
const textureLoader = new TextureLoader();
let photoTextures: Map<string, any> = new Map();
let depthTextures: Map<string, any> = new Map();
let material: MeshStandardMaterial;
let lastFrameTime = 0;
let currentXIndex = 0;
let currentYIndex = 0;

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
  material = new MeshStandardMaterial({
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

  return { canvas: canvasEl, material };
}

// Preload all textures
async function preloadTextures() {
  // Clear existing textures
  photoTextures.clear();
  depthTextures.clear();

  const allSteps = steps.flat();
  console.log(`Preloading ${allSteps.length} textures for ${PREFIX}...`);

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

// Create photo switcher UI
function createPhotoSwitcher() {
  const switcher = document.createElement('div');
  switcher.className = 'photo-switcher';

  Object.entries(photos).forEach(([key, photo]) => {
    const button = document.createElement('button');
    button.className = 'photo-switcher-btn';
    button.dataset.photoKey = key;

    const img = document.createElement('img');
    img.src = photo.filename;
    img.alt = key;

    const label = document.createElement('span');
    label.textContent = key;

    button.appendChild(img);
    button.appendChild(label);

    button.addEventListener('click', async () => {
      // Update active state
      document.querySelectorAll('.photo-switcher-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      button.disabled = true;

      await loadPhoto(photo);
      button.disabled = false;
    });

    switcher.appendChild(button);
  });

  document.body.appendChild(switcher);
}

// Load a photo configuration
async function loadPhoto(photo: Photo) {
  currentPhoto = photo;

  const result = generateSteps({
    X_STEPS: photo.X_STEPS,
    Y_STEPS: photo.Y_STEPS,
    PREFIX: photo.PREFIX,
  });

  PREFIX = result.PREFIX;
  Y_STEPS = result.Y_STEPS;
  X_STEPS = result.X_STEPS;
  steps = result.steps;

  console.log('Loading photo:', PREFIX, X_STEPS, Y_STEPS);

  // Preload textures for new photo
  await preloadTextures();

  // Reset indices to center
  currentXIndex = Math.floor(X_STEPS / 2);
  currentYIndex = Math.floor(Y_STEPS / 2);

  // Set initial texture
  const initialStep = steps[currentYIndex][currentXIndex];
  if (photoTextures.has(initialStep.filename)) {
    material.map = photoTextures.get(initialStep.filename);
    material.displacementMap = depthTextures.get(initialStep.filename);
    material.needsUpdate = true;
  }
}

// Handle mouse movement
function handleMouseMove(e: MouseEvent) {
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
}

// Initialize app
async function init() {
  // Setup scene
  const { canvas } = setupScene();
  viewerContainer.appendChild(canvas);

  // Add depth control
  const depthControl = document.createElement('input');
  depthControl.type = 'range';
  depthControl.min = '0';
  depthControl.max = '5';
  depthControl.step = '0.1';
  depthControl.value = DEFAULT_DISPLACEMENT_SCALE.toString();
  depthControl.className = 'depth-control';

  const depthLabel = document.createElement('label');
  depthLabel.appendChild(depthControl);
  viewerContainer.appendChild(depthLabel);

  depthControl.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    material.displacementScale = value;
    material.needsUpdate = true;
  });

  // Create photo switcher
  createPhotoSwitcher();

  // Load first photo
  const firstPhoto = Object.values(photos)[0];
  await loadPhoto(firstPhoto);

  // Set first button as active
  document.querySelector('.photo-switcher-btn')?.classList.add('active');

  // Add mouse move listener
  document.addEventListener('mousemove', handleMouseMove);
}

// Start the app
init();

export {};

