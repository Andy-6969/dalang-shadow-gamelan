// The kelir: the lit cotton screen of the shadow play, its carved frame, the banana trunk the
// puppets stand in, and the blencong oil lamp the player defends.

import { VIEW_W, VIEW_H, LAMP_X, LAMP_Y, LAMP, PALETTE } from './config.js';
import { drawKayon } from './puppets.js';

let backdropCache = null;

function buildBackdrop() {
  const c = document.createElement('canvas');
  c.width = VIEW_W;
  c.height = VIEW_H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ebc98e';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // woven cotton texture
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#7a4a1c';
  for (let y = 0; y < VIEW_H; y += 3) ctx.fillRect(0, y, VIEW_W, 1);
  for (let x = 0; x < VIEW_W; x += 4) ctx.fillRect(x, 0, 1, VIEW_H);
  ctx.globalAlpha = 1;
  // faint parang batik diagonals printed on the screen
  ctx.strokeStyle = 'rgba(140, 80, 30, 0.08)';
  ctx.lineWidth = 10;
  for (let x = -VIEW_H; x < VIEW_W; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H);
    ctx.lineTo(x + VIEW_H, 0);
    ctx.stroke();
  }
  // banana trunk (gedebog) along the bottom
  const g = ctx.createLinearGradient(0, VIEW_H - 46, 0, VIEW_H);
  g.addColorStop(0, '#7f9a3a');
  g.addColorStop(0.5, '#4f6a22');
  g.addColorStop(1, '#2c3c12');
  ctx.fillStyle = g;
  ctx.fillRect(0, VIEW_H - 40, VIEW_W, 40);
  ctx.strokeStyle = 'rgba(30, 40, 10, 0.5)';
  ctx.lineWidth = 2;
  for (let x = 0; x < VIEW_W; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H - 40);
    ctx.lineTo(x + 8, VIEW_H);
    ctx.stroke();
  }
  // carved top valance (palemahan) in red and gold
  ctx.fillStyle = PALETTE.redDeep;
  ctx.fillRect(0, 0, VIEW_W, 14);
  ctx.fillStyle = PALETTE.gold;
  for (let x = 0; x < VIEW_W; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 14);
    ctx.quadraticCurveTo(x + 16, 34, x + 32, 14);
    ctx.fill();
  }
  // side kayon puppets planted at the edges
  drawKayon(ctx, 70, VIEW_H - 40, 250, 0, 0.9);
  drawKayon(ctx, VIEW_W - 70, VIEW_H - 40, 250, 1, 0.9);
  return c;
}

export function drawKelir(ctx, t, darkness = 0) {
  if (!backdropCache) backdropCache = buildBackdrop();
  ctx.drawImage(backdropCache, 0, 0);
  // the lamp's warm pool of light, flickering
  const flicker = 1 + Math.sin(t * 13) * 0.02 + Math.sin(t * 7.3) * 0.03;
  const glow = ctx.createRadialGradient(LAMP_X, LAMP_Y - 30, 30, LAMP_X, LAMP_Y, 760 * flicker);
  glow.addColorStop(0, 'rgba(255, 240, 180, 0.85)');
  glow.addColorStop(0.3, 'rgba(255, 180, 70, 0.32)');
  glow.addColorStop(0.7, 'rgba(120, 40, 10, 0.32)');
  glow.addColorStop(1, 'rgba(30, 8, 2, 0.88)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (darkness > 0) {
    // eclipse: night creeps in from the edges while the lamp holds a warm island
    const eclipse = ctx.createRadialGradient(LAMP_X, LAMP_Y, 120, LAMP_X, LAMP_Y, 820);
    eclipse.addColorStop(0, 'rgba(40, 10, 60, 0)');
    eclipse.addColorStop(0.45, `rgba(48, 16, 82, ${darkness * 0.45})`);
    eclipse.addColorStop(1, `rgba(16, 6, 34, ${Math.min(0.92, darkness * 1.35)})`);
    ctx.fillStyle = eclipse;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // a few stars pricking through the darkened screen
    ctx.fillStyle = `rgba(255, 240, 200, ${darkness * 0.8})`;
    for (let i = 0; i < 40; i++) {
      const sx = (i * 397) % VIEW_W;
      const sy = 20 + ((i * 211) % 300);
      if (Math.hypot(sx - LAMP_X, sy - LAMP_Y) < 380) continue;
      const tw = 1 + ((i + Math.floor(t * 2)) % 3 === 0 ? 1 : 0);
      ctx.fillRect(sx, sy, tw, tw);
    }
  }
}

export function drawLamp(ctx, lamp, t, beatPulse) {
  const x = LAMP_X;
  const y = LAMP_Y;
  const oilRatio = lamp.oil / LAMP.maxOil;
  // oil ring
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(26, 13, 8, 0.45)';
  ctx.beginPath();
  ctx.arc(x, y, LAMP.radius + 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = oilRatio > 0.35 ? PALETTE.gold : PALETTE.bad;
  ctx.beginPath();
  ctx.arc(x, y, LAMP.radius + 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * oilRatio);
  ctx.stroke();
  // beat ring around the lamp
  ctx.strokeStyle = `rgba(255, 224, 138, ${0.6 * (1 - beatPulse)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, LAMP.radius + 18 + beatPulse * 40, 0, Math.PI * 2);
  ctx.stroke();
  // the bronze bird-shaped blencong
  ctx.fillStyle = '#7a4a1c';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 34, y + 8);
  ctx.quadraticCurveTo(x, y + 34, x + 34, y + 8);
  ctx.lineTo(x + 46, y - 6);
  ctx.lineTo(x + 26, y - 2);
  ctx.quadraticCurveTo(x, y + 6, x - 26, y - 2);
  ctx.lineTo(x - 46, y - 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(x, y + 12, 8, 0, Math.PI * 2);
  ctx.fill();
  // flame
  const fh = (26 + Math.sin(t * 17) * 4) * (0.45 + 0.55 * oilRatio) * (lamp.flare > 0 ? 1.6 : 1);
  const fg = ctx.createRadialGradient(x + 40, y - 14, 2, x + 40, y - 14 - fh * 0.4, fh);
  fg.addColorStop(0, '#fffbe0');
  fg.addColorStop(0.4, '#ffcf3f');
  fg.addColorStop(1, 'rgba(255, 90, 20, 0)');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(x + 32, y - 8);
  ctx.quadraticCurveTo(x + 40 + Math.sin(t * 9) * 4, y - 14 - fh * 1.6, x + 48, y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 40, y - 14, fh * 0.9, 0, Math.PI * 2);
  ctx.fill();
}
