// Boot: sizes the canvas, wires input and audio, runs the frame loop, draws the world in depth
// order and routes keys and clicks to the current screen. ?shot=<scene> stages a scene instead.

import { VIEW_W, VIEW_H, LAMP_X, LAMP_Y } from './config.js';
import { GamelanAudio } from './audio.js';
import { Input } from './input.js';
import { Game } from './game.js';
import { drawKelir, drawLamp } from './stage.js';
import { drawHud } from './hud.js';
import { buttons, drawTitle, drawDraft, drawResults, drawPause } from './screens.js';
import { stageScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = new GamelanAudio();
const input = new Input(canvas);
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const game = new Game(audio, Number(params.get('seed')) || 7);
input.onFirstGesture = () => audio.unlock();

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function runAction(action) {
  if (action === 'play') { audio.unlock(); game.startRun(); }
  else if (action === 'title') game.state = 'title';
  else if (action.startsWith('diff:')) game.diffIndex = Number(action.slice(5));
  else if (action.startsWith('tembang:')) game.pickTembang(Number(action.slice(8)));
  else if (action.startsWith('road:')) game.pickRoad(action.slice(5));
}

function handleMenus() {
  if (input.mouse.leftPressed) {
    const hit = buttons.find((b) => input.mouse.x >= b.x && input.mouse.x <= b.x + b.w && input.mouse.y >= b.y && input.mouse.y <= b.y + b.h);
    if (hit) { runAction(hit.action); input.mouse.leftPressed = false; input.mouse.left = false; }
  }
  if (input.hit('KeyM')) audio.toggleMute();
  if (game.state === 'title') {
    if (input.hit('Digit1')) game.diffIndex = 0;
    if (input.hit('Digit2')) game.diffIndex = 1;
    if (input.hit('Digit3')) game.diffIndex = 2;
    if (input.hit('Enter') || input.hit('Space')) runAction('play');
  } else if (game.state === 'draft') {
    if (input.hit('Digit1')) game.pickTembang(0);
    if (input.hit('Digit2')) game.pickTembang(1);
    if (input.hit('Digit3')) game.pickTembang(2);
    if (input.hit('KeyQ')) game.pickRoad('garagara');
    if (input.hit('KeyE')) game.pickRoad('limbukan');
  } else if (game.state === 'end') {
    if (input.hit('KeyR') || input.hit('Enter')) runAction('play');
    if (input.hit('KeyT')) game.state = 'title';
  } else if (game.state === 'play') {
    if (input.hit('KeyP') || input.hit('Escape')) game.paused = !game.paused;
    if (input.hit('KeyR')) runAction('play');
    if (game.paused && input.hit('KeyT')) { game.paused = false; game.state = 'title'; }
  }
}

function drawWorld() {
  const darkness = game.boss && game.boss.darkness ? game.boss.darkness : 0;
  drawKelir(ctx, game.time, darkness);
  const actors = [...game.foes, game.player];
  if (game.boss) actors.push(game.boss);
  const lampPulse = 1 - game.beatFlash;
  const behind = actors.filter((a) => a.y < LAMP_Y + 20).sort((a, b) => a.y - b.y);
  const front = actors.filter((a) => a.y >= LAMP_Y + 20).sort((a, b) => a.y - b.y);
  for (const a of behind) a.draw(ctx);
  ctx.save();
  ctx.translate(LAMP_X, LAMP_Y);
  ctx.scale(1.35, 1.35);
  ctx.translate(-LAMP_X, -LAMP_Y);
  drawLamp(ctx, game.lamp, game.time, lampPulse);
  ctx.restore();
  for (const a of front) a.draw(ctx);
  for (const b of game.bolts) b.draw(ctx);
  game.effects.drawWorld(ctx);
}

function render() {
  buttons.length = 0;
  ctx.save();
  if (game.effects.shake > 0 && game.state === 'play') {
    ctx.translate((Math.random() - 0.5) * game.effects.shake, (Math.random() - 0.5) * game.effects.shake);
  }
  if (game.state === 'title') {
    drawKelir(ctx, game.time, 0);
    drawTitle(ctx, game);
  } else {
    drawWorld();
    if (game.state === 'play') {
      drawHud(ctx, game);
      game.effects.drawCallouts(ctx, 640, 205);
      if (game.paused) drawPause(ctx);
    } else if (game.state === 'draft') {
      drawDraft(ctx, game);
    } else if (game.state === 'end') {
      drawResults(ctx, game);
    }
  }
  ctx.restore();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  handleMenus();
  game.update(dt, input);
  render();
  input.endFrame();
  requestAnimationFrame(frame);
}

if (shot) {
  // Staged scene for screenshots: the game's own code simulates into the moment, then holds it.
  stageScene(game, shot, input);
  render();
  document.fonts.ready.then(() => render());
} else {
  requestAnimationFrame(frame);
}
