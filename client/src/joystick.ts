import type { InputVector } from "./input";

/** Tilts smaller than this are treated as "not moving". */
const DEAD_ZONE = 0.15;

/** Throttle pointermove events so we don't flood the server with messages. */
const EMIT_INTERVAL_MS = 50;

/**
 * On-screen joystick for touch devices. Reports the drag direction through
 * `onChange`, using the same convention as the keyboard (screen up = -z).
 * Only created when the device has a coarse pointer; returns whether it was.
 */
export function createJoystick(onChange: (input: InputVector) => void): boolean {
  if (!window.matchMedia("(pointer: coarse)").matches) {
    return false;
  }

  const base = document.createElement("div");
  base.id = "joystick";
  const thumb = document.createElement("div");
  thumb.id = "joystick-thumb";
  base.appendChild(thumb);
  document.body.appendChild(base);

  let activePointer: number | null = null;
  let current: InputVector = { x: 0, z: 0 };
  let lastEmit = 0;
  let throttleTimer: ReturnType<typeof setTimeout> | undefined;

  const emit = (immediate = false) => {
    clearTimeout(throttleTimer);
    const elapsed = performance.now() - lastEmit;
    if (immediate || elapsed >= EMIT_INTERVAL_MS) {
      lastEmit = performance.now();
      onChange(current);
    } else {
      throttleTimer = setTimeout(() => emit(true), EMIT_INTERVAL_MS - elapsed);
    }
  };

  const update = (event: PointerEvent) => {
    const rect = base.getBoundingClientRect();
    const radius = rect.width / 2;
    let x = (event.clientX - (rect.left + radius)) / radius;
    let z = (event.clientY - (rect.top + radius)) / radius;

    // keep the thumb inside the ring
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }

    thumb.style.transform = `translate(${x * radius * 0.7}px, ${z * radius * 0.7}px)`;
    current = length < DEAD_ZONE ? { x: 0, z: 0 } : { x, z };
    emit();
  };

  const release = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    thumb.style.transform = "";
    current = { x: 0, z: 0 };
    emit(true);
  };

  base.addEventListener("pointerdown", (event) => {
    activePointer = event.pointerId;
    base.setPointerCapture(event.pointerId);
    update(event);
  });
  base.addEventListener("pointermove", (event) => {
    if (event.pointerId === activePointer) update(event);
  });
  base.addEventListener("pointerup", release);
  base.addEventListener("pointercancel", release);

  return true;
}
