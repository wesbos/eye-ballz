import { FPS, generateSteps } from './constants.js';
import { photos, Photo } from './photos.js';

// State management
let currentPhoto: Photo;
let PREFIX: string;
let Y_STEPS: number;
let X_STEPS: number;
let steps: ReturnType<typeof generateSteps>['steps'];

// DOM elements
const preview = document.querySelector('.preview') as HTMLDivElement;
const images: HTMLImageElement[] = [];
let videoContainer: HTMLDivElement;
let video: HTMLVideoElement;
let lastFrameTime = 0;

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

    button.addEventListener('click', () => {
      loadPhoto(photo);
      // Update active state
      document.querySelectorAll('.photo-switcher-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
    });

    switcher.appendChild(button);
  });

  document.body.appendChild(switcher);
}

// Initialize video container
function initializeVideoContainer() {
  if (videoContainer) {
    document.body.removeChild(videoContainer);
  }

  videoContainer = document.createElement('div');
  videoContainer.className = 'video-container';

  video = document.createElement('video');
  video.src = `./outputs/${PREFIX}/${PREFIX}.mp4`;
  video.preload = 'auto';
  video.muted = true;

  videoContainer.appendChild(video);
  document.body.insertBefore(videoContainer, preview);

  video.addEventListener('loadedmetadata', () => {
    console.log('Video loaded, duration:', video.duration, 'frames:', X_STEPS * Y_STEPS);
  });
}

// Load a photo configuration
function loadPhoto(photo: Photo) {
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

  console.log('Loading photo:', steps, PREFIX, Y_STEPS, X_STEPS);

  // Update CSS variables
  preview.style.setProperty('--x-steps', X_STEPS.toString());
  preview.style.setProperty('--y-steps', Y_STEPS.toString());

  // Clear existing images
  preview.innerHTML = '';
  images.length = 0;

  // Generate the grid of images
  for (const row of steps) {
    for (const step of row) {
      const img = document.createElement('img');
      img.src = `./outputs/${PREFIX}/${step.filename}`;
      img.alt = `Position ${step.x}, ${step.y}`;
      preview.appendChild(img);
      images.push(img);
    }
  }

  // Reinitialize video
  initializeVideoContainer();
}

// Handle mouse movement
function handlePointerMove(e: MouseEvent) {
  // Throttle to match video FPS for smoother playback
  const now = performance.now();
  if (now - lastFrameTime < 1000 / FPS) {
    return;
  }
  lastFrameTime = now;

  // Calculate container center position
  const containerRect = videoContainer.getBoundingClientRect();
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
  const videoXIndex = Math.round(((containerNormalizedX + 1) / 2) * (X_STEPS - 1));
  const videoYIndex = Math.round(((containerNormalizedY + 1) / 2) * (Y_STEPS - 1));

  // Calculate frame index (row-major order: y * width + x)
  const frameIndex = videoYIndex * X_STEPS + videoXIndex;

  // Calculate time for this frame based on FPS
  const frameTime = frameIndex / FPS;

  // Update video currentTime if it's loaded
  if (video && video.readyState >= 2) { // HAVE_CURRENT_DATA or better
    video.currentTime = frameTime;
  }

  // Update all images
  images.forEach((img) => {
    // Get the image's bounding box
    const rect = img.getBoundingClientRect();
    const imgCenterX = rect.left + rect.width / 2;
    const imgCenterY = rect.top + rect.height / 2;

    // Calculate the direction from image center to mouse
    const deltaX = e.clientX - imgCenterX;
    const deltaY = e.clientY - imgCenterY;

    // Normalize to -1 to 1 range based on distance
    const maxDistance = 500;
    const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDistance));
    const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDistance));

    // Map normalized values to our step indices (0 to X_STEPS-1 / Y_STEPS-1)
    // -1 maps to 0, 0 maps to middle, 1 maps to max
    const xIndex = Math.round(((normalizedX + 1) / 2) * (X_STEPS - 1));
    const yIndex = Math.round(((normalizedY + 1) / 2) * (Y_STEPS - 1));

    // Update the image source - access nested array [row][col]
    img.src = `./outputs/${PREFIX}/${steps[yIndex][xIndex].filename}`;
  });
}

// Initialize app
function init() {
  createPhotoSwitcher();

  // Load the first photo
  const firstPhoto = Object.values(photos)[0];
  loadPhoto(firstPhoto);

  // Set first button as active
  document.querySelector('.photo-switcher-btn')?.classList.add('active');

  // Add mouse move listener
  document.addEventListener('pointermove', handlePointerMove);
}

// Start the app
init();

