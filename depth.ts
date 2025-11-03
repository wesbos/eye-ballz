import {
  DepthEstimationPipeline,
  DepthEstimationPipelineOutput,
  RawImage,
  pipeline,
  env,
} from "@huggingface/transformers";
import { PREFIX, Step, steps } from './constants.js';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync, mkdir, mkdirSync } from 'node:fs';
import pAll from 'p-all';

const depthEstimator = await pipeline(
  "depth-estimation",
  "Xenova/depth-anything-large-hf",
);


async function estimateDepth(step: Step) {
  console.log(`Estimating depth for ${step.filename}...`);
  const depthDir = path.join(__dirname, "outputs", PREFIX, "depth");
  const depthPath = path.join(depthDir, `${step.filename}.depth.png`);
  // if the file already exists, skip
  if (existsSync(depthPath)) {
    console.log(`Depth for ${step.filename} already exists, skipping...`);
    return;
  }
  // make the path if it doesnt exist
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
