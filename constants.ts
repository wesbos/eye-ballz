export const X_STEPS = 25;
export const Y_STEPS = 25;
export const ROTATE_BOUND = 20;
export  const PUPIL_BOUND = 15;
export const PREFIX = "wes-big";
// export const PREFIX = "output";
export const FPS = 60;

function round(value: number, precision: number) {
  return Math.round(value * precision) / precision;
}

export const steps = Array.from({ length: Y_STEPS }, (_, y) =>
  Array.from({ length: X_STEPS }, (_, x) => {
    const index = y * X_STEPS + x;
    // Horizontal Head Rotation - X-axis 20 = look left. -20 = look right.
    const rotate_yaw = round(ROTATE_BOUND * 2 * (x / (X_STEPS - 1)) - ROTATE_BOUND, 10);
    // Vertical Head Rotation - Y-axis. 20 = look down. -20 = look up.
    const rotate_pitch = round(ROTATE_BOUND * 2 * (y / (Y_STEPS - 1)) - ROTATE_BOUND, 10);

    // Roll matches the pitch (inverted) - natural head tilt when looking up/down
    // const rotate_roll = -rotate_pitch;
    const pupil_x = round(PUPIL_BOUND * 2 * (x / (X_STEPS - 1)) - PUPIL_BOUND, 10);
    const pupil_y = round((PUPIL_BOUND * 2 * (y / (Y_STEPS - 1)) - PUPIL_BOUND) * -1, 10);
    return {
      x,
      y,
      index,
      rotate_yaw,
      rotate_pitch,
      // rotate_roll,
      pupil_x,
      pupil_y,
      filename: `${PREFIX}_${String(index).padStart(
        3,
        "0"
      )}_${x}_${y}_yaw${rotate_yaw}_pitch${rotate_pitch}_px${pupil_x}_py${pupil_y}.webp`,
      crop_factor: 1.5, // lowest possible
      output_quality: 100
    };
  })
);

const flatSteps = steps.flat();
export type Step = (typeof flatSteps)[number];
