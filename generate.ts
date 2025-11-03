import Replicate from "replicate";
import fs from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import {
  PREFIX,
  PUPIL_BOUND,
  ROTATE_BOUND,
  X_STEPS,
  Y_STEPS,
  steps,
} from "./constants.js";

const execAsync = promisify(exec);

const model =
  "fofr/expression-editor:bf913bc90e1c44ba288ba3942a538693b72e8cc7df576f3beebe56adc0a92b86";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const image = fs.readFileSync("wes-straight-on.jpg");

async function generate(step: (typeof steps)[number]) {
  const outputDir = path.join(__dirname, "outputs", PREFIX);
  const outputPath = path.join(outputDir, step.filename);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Skip this step if the file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`Skipping ${step.filename} because it already exists`);
    return;
  }
  console.log(`Generating ${step.filename}...`);
  const output = await replicate.run(model, {
    input: {
      image,
      ...step,
    },
  });
  await writeFile(outputPath, output[0]);
  console.log(`Generated ${step.filename}...`);
}

async function generateVideo() {
  console.log("Generating video with ffmpeg...");

  const outputDir = path.join(__dirname, "outputs", PREFIX);
  const videoOutput = path.join(outputDir, `${PREFIX}.mp4`);
  const concatFile = path.join(outputDir, "concat.txt");

  // Create a concat file listing all images in order
  const concatContent = steps.flat()
    .map((step) => `file '${path.join(outputDir, step.filename)}'`)
    .join("\n");

  await writeFile(concatFile, concatContent);

  // Full ffmpeg command
  // -r 10 = 10fps = each image shown for 100ms
  // Using concat demuxer to ensure correct order
  const command = `ffmpeg -y \
    -f concat \
    -safe 0 \
    -r 10 \
    -i "${concatFile}" \
    -c:v libx264 \
    -preset medium \
    -crf 23 \
    -pix_fmt yuv420p \
    "${videoOutput}"`;

  try {
    const { stdout, stderr } = await execAsync(command);
    console.log("Video generated successfully:", videoOutput);
    if (stderr) console.log("FFmpeg output:", stderr);

    // Clean up concat file
    fs.unlinkSync(concatFile);
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}

const cost = steps.length * 0.00098;
const formatter=new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

console.log(`Estimated cost: ${formatter.format(cost)}`);
await Promise.all(steps.flat().map(generate));

// Generate the video from all images
await generateVideo();

/*
  Based on https://github.com/kylan02/face_looker/blob/main/main.py
*/
