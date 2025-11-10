import { FPS, generateSteps } from './constants.js';
import { activePhoto } from './photos.js';


const { PREFIX, Y_STEPS, X_STEPS, steps } = generateSteps({
  X_STEPS: activePhoto.X_STEPS,
  Y_STEPS: activePhoto.Y_STEPS,
  PREFIX: activePhoto.PREFIX,
});

console.log(steps, PREFIX, Y_STEPS, X_STEPS);

// Create a grid container
const preview = document.querySelector('.preview') as HTMLDivElement;

// Set the number of columns dynamically
preview.style.setProperty('--x-steps', X_STEPS.toString());
preview.style.setProperty('--y-steps', Y_STEPS.toString());

// Store all image elements for updating
const images: HTMLImageElement[] = [];

// Create video container
const videoContainer = document.createElement('div');
videoContainer.className = 'video-container';

// Create and setup video element
const video = document.createElement('video');
video.src = `./outputs/${PREFIX}/${PREFIX}.mp4`;
video.preload = 'auto';
video.muted = true;

// Add video to container
videoContainer.appendChild(video);

// Add container to page
document.body.insertBefore(videoContainer, preview);

// Wait for video to load
video.addEventListener('loadedmetadata', () => {
  console.log('Video loaded, duration:', video.duration, 'frames:', X_STEPS * Y_STEPS);
});

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

// Track mouse movement and update images
let lastFrameTime = 0;
document.addEventListener('mousemove', (e) => {
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
  if (video.readyState >= 2) { // HAVE_CURRENT_DATA or better
    video.currentTime = frameTime;
  }
  console.log(videoXIndex, videoYIndex, frameTime);

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
});

