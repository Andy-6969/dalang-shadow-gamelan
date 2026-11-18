// Keyboard and mouse state, with mouse positions mapped into the 1280x800 view.

import { VIEW_W, VIEW_H } from './config.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: VIEW_W / 2, y: VIEW_H / 2, left: false, right: false, leftPressed: false, rightPressed: false };
    this.onFirstGesture = null;

    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      this.gesture();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    canvas.addEventListener('mousemove', (e) => this.track(e));
    canvas.addEventListener('mousedown', (e) => {
      this.track(e);
      if (e.button === 0) { this.mouse.left = true; this.mouse.leftPressed = true; }
      if (e.button === 2) { this.mouse.right = true; this.mouse.rightPressed = true; }
      this.gesture();
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('blur', () => this.keys.clear());
  }

  gesture() {
    if (this.onFirstGesture) this.onFirstGesture();
  }

  track(e) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * VIEW_W;
    this.mouse.y = ((e.clientY - r.top) / r.height) * VIEW_H;
  }

  down(code) { return this.keys.has(code); }
  hit(code) { return this.pressed.has(code); }

  moveAxis() {
    let x = 0; let y = 0;
    if (this.down('KeyA') || this.down('ArrowLeft')) x -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) x += 1;
    if (this.down('KeyW') || this.down('ArrowUp')) y -= 1;
    if (this.down('KeyS') || this.down('ArrowDown')) y += 1;
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.leftPressed = false;
    this.mouse.rightPressed = false;
  }
}
