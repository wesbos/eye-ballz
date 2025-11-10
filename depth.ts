import {
  type DepthEstimationPipelineOutput,
  pipeline,
} from "@huggingface/transformers";
import { type Step, generateSteps } from './constants.ts';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import pAll from 'p-all';
import { photos } from './photos.ts';

const activePhoto = photos.arnold;

const {steps, PREFIX, X_STEPS, Y_STEPS} = generateSteps({
  X_STEPS: activePhoto.X_STEPS,
  Y_STEPS: activePhoto.Y_STEPS,
  PREFIX: activePhoto.PREFIX,
});

const depthEstimator = await pipeline(
  "depth-estimation",
  "Xenova/depth-anything-large-hf",
);

const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function estimateDepth(step: Step) {
  console.log(`Estimating depth for ${step.filename}...`);
  const depthDir = path.join(__dirname, "outputs", PREFIX, "depth");
  const depthPath = path.join(depthDir, `${step.filename}.depth.png`);
  // if the file already exists, skip
  if (existsSync(depthPath)) {
    console.log(`Depth for ${step.filename} already exists, skipping...`);
    return;
  }
  // make the path if it doesn't exist
  if (!existsSync(depthDir)) {
     mkdirSync(depthDir);
  }
  const image = await readFile(`./outputs/${PREFIX}/${step.filename}`);
  // convert to Blob
  const blob = new Blob([image]);
  const { depth } = (await depthEstimator(
    blob
  )) as DepthEstimationPipelineOutput;
  // save to file as image
  await depth.save(depthPath);
  return depth;
}

// for(const step of steps.flat()) {
//   console.log(`Estimating depth for ${step.filename}...`);

//   await estimateDepth(step);
// }

const actions = steps.flat().map((step) => () => estimateDepth(step));
await pAll(actions, { concurrency: 10 });
