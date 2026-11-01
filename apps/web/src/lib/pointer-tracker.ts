export type PointerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  moving: boolean;
};

const offscreen = -9999;
const settleMs = 80;

const state: PointerState = { x: offscreen, y: offscreen, vx: 0, vy: 0, moving: false };
const listeners = new Set<() => void>();
let settleTimer = 0;

export function pointerPresent(pointer: PointerState) {
  return pointer.x > offscreen / 10;
}

function move(clientX: number, clientY: number) {
  const fresh = !pointerPresent(state);
  state.vx = fresh ? 0 : clientX - state.x;
  state.vy = fresh ? 0 : clientY - state.y;
  state.x = clientX;
  state.y = clientY;
  state.moving = true;
  window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(() => {
    state.moving = false;
    state.vx = 0;
    state.vy = 0;
  }, settleMs);
  for (const listener of listeners) listener();
}

const onMouseMove = (event: MouseEvent) => {
  move(event.clientX, event.clientY);
};

const onTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0];
  if (!touch) return;
  state.x = touch.clientX;
  state.y = touch.clientY;
};

const onTouchMove = (event: TouchEvent) => {
  const touch = event.touches[0];
  if (touch) move(touch.clientX, touch.clientY);
};

const onTouchEnd = () => {
  state.x = offscreen;
  state.y = offscreen;
  for (const listener of listeners) listener();
};

export function readPointer(): Readonly<PointerState> {
  return state;
}

export function trackPointer(listener: () => void) {
  if (listeners.size === 0) {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onTouchEnd);
  };
}
