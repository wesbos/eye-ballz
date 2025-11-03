export const X_STEPS = 10;
export const Y_STEPS = 10;
export const ROTATE_BOUND = 20;
export  const PUPIL_BOUND = 15;
export const PREFIX = "wes";
// export const PREFIX = "output";


export const steps = Array.from({ length: Y_STEPS }, (_, y) =>
  Array.from({ length: X_STEPS }, (_, x) => {
    const index = y * X_STEPS + x;
    // Horizontal Head Rotation - X-axis 20 = look left. -20 = look right.
    const rotate_yaw = ROTATE_BOUND * 2 * (x / (X_STEPS - 1)) - ROTATE_BOUND;
    // Vertical Head Rotation - Y-axis. 20 = look down. -20 = look up.
    const rotate_pitch = ROTATE_BOUND * 2 * (y / (Y_STEPS - 1)) - ROTATE_BOUND;

    // Roll matches the pitch (inverted) - natural head tilt when looking up/down
    // const rotate_roll = -rotate_pitch;
    const pupil_x = PUPIL_BOUND * 2 * (x / (X_STEPS - 1)) - PUPIL_BOUND;
    const pupil_y = (PUPIL_BOUND * 2 * (y / (Y_STEPS - 1)) - PUPIL_BOUND) * -1;
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
    };
  })
);

