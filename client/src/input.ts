export interface InputVector {
  x: number;
  z: number;
}

const KEY_BINDINGS: Record<string, keyof typeof PRESSED> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

const PRESSED = { up: false, down: false, left: false, right: false };

/**
 * Tracks WASD/arrow keys and reports the movement direction whenever it
 * changes, so we only react on key press/release. The convention (screen up
 * = -z) matches the joystick and the server's world axes.
 */
export function trackInput(onChange: (input: InputVector) => void) {
  let last: InputVector = { x: 0, z: 0 };

  const update = () => {
    const current = {
      x: (PRESSED.right ? 1 : 0) - (PRESSED.left ? 1 : 0),
      z: (PRESSED.down ? 1 : 0) - (PRESSED.up ? 1 : 0),
    };
    if (current.x !== last.x || current.z !== last.z) {
      last = current;
      onChange(current);
    }
  };

  window.addEventListener("keydown", (event) => {
    const action = KEY_BINDINGS[event.code];
    if (action && !event.repeat) {
      PRESSED[action] = true;
      update();
    }
  });

  window.addEventListener("keyup", (event) => {
    const action = KEY_BINDINGS[event.code];
    if (action) {
      PRESSED[action] = false;
      update();
    }
  });

  // stop moving when the tab loses focus
  window.addEventListener("blur", () => {
    PRESSED.up = PRESSED.down = PRESSED.left = PRESSED.right = false;
    update();
  });
}
