// Wayang kulit art, drawn as canvas paths: the hero, the foes, the bosses and the kayon tree.
// Every figure is drawn twice: first as the soft shadow the lamp throws on the screen, then
// as the painted leather puppet itself, with its control rods hanging below.

import { LAMP_X, LAMP_Y, PALETTE } from './config.js';

const SHADOW = 'rgba(30, 12, 6, 0.32)';

function paintFor(shadow, color) {
  return shadow ? SHADOW : color;
}

function poly(ctx, pts, fill, stroke, lw = 2) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

function blob(ctx, x, y, rx, ry, fill, stroke, lw = 2) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

// Tatahan: the punched dot lace of a leather puppet.
function tatahan(ctx, x0, y0, w, h, color, step = 5) {
  ctx.fillStyle = color;
  for (let y = y0; y < y0 + h; y += step) {
    const shift = ((y - y0) / step) % 2 ? step / 2 : 0;
    for (let x = x0 + shift; x < x0 + w; x += step) {
      ctx.fillRect(x, y, 1.4, 1.4);
    }
  }
}

function rod(ctx, x1, y1, x2, y2, shadow) {
  ctx.strokeStyle = paintFor(shadow, '#5a3416');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Shadow offset: away from the lamp, longer the further the puppet stands from it.
export function shadowOffset(x, y) {
  const dx = x - LAMP_X;
  const dy = y - LAMP_Y;
  const d = Math.hypot(dx, dy) || 1;
  const len = 8 + d * 0.045;
  return { x: (dx / d) * len, y: (dy / d) * len * 0.6 + 6 };
}

export function drawWithShadow(ctx, x, y, scale, facing, drawFn) {
  const off = shadowOffset(x, y);
  ctx.save();
  ctx.translate(x + off.x, y + off.y);
  ctx.scale(scale * facing * 1.06, scale * 1.06);
  drawFn(ctx, true);
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);
  drawFn(ctx, false);
  ctx.restore();
}

// ---- The hero: a ksatria with a keris, slim and refined (alus) ----
export function drawSatria(ctx, shadow, pose = {}) {
  const swing = pose.swing ?? 0;
  const arm = pose.armAngle ?? -0.3;
  const ink = paintFor(shadow, PALETTE.ink);
  const gold = paintFor(shadow, PALETTE.gold);
  const red = paintFor(shadow, PALETTE.red);
  const teal = paintFor(shadow, PALETTE.teal);
  const out = shadow ? null : PALETTE.ink;

  rod(ctx, 0, -60, 0, 34, shadow); // gapit, the central rod
  // back arm
  ctx.save();
  ctx.translate(-2, -70);
  ctx.rotate(0.5 - swing * 0.3);
  poly(ctx, [-2, 0, 3, 0, 2, 26, -3, 26], gold, out, 1.5);
  poly(ctx, [-3, 26, 2, 26, 6, 50, 1, 51], gold, out, 1.5);
  rod(ctx, 3, 50, 3, 92, shadow);
  ctx.restore();
  // legs and dodot cloth
  poly(ctx, [-6, -40, 2, -40, -14, 0, -26, 0], ink, out, 1.5);
  poly(ctx, [0, -40, 8, -40, 22, 0, 12, 0], ink, out, 1.5);
  poly(ctx, [-12, -50, 12, -50, 22, -18, 4, -12, -30, -4, -22, -24], red, out, 2);
  if (!shadow) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-14 + i * 2, -44 + i * 8);
      ctx.lineTo(14 + i * 2, -44 + i * 8);
      ctx.stroke();
    }
  }
  // torso
  poly(ctx, [-9, -50, 9, -50, 10, -74, -10, -72], gold, out, 2);
  if (!shadow) tatahan(ctx, -7, -71, 15, 19, PALETTE.goldDeep, 4);
  poly(ctx, [-10, -52, 10, -52, 10, -48, -10, -48], teal, null);
  // head: crown, hair, black refined face with a long nose
  poly(ctx, [-12, -88, -4, -110, 2, -96, 8, -106, 6, -88], gold, out, 2);
  poly(ctx, [-18, -96, -8, -86, -14, -70, -20, -78], ink, out, 1.5);
  blob(ctx, -14, -94, 5, 7, red, out, 1.5);
  poly(ctx, [-6, -90, 4, -92, 20, -80, 8, -79, 4, -75, -4, -74], ink, out, 1.5);
  if (!shadow) {
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, -86);
    ctx.quadraticCurveTo(8, -88, 11, -85);
    ctx.stroke();
  }
  // keris arm, aimed by the pose
  ctx.save();
  ctx.translate(6, -70);
  ctx.rotate(arm + swing);
  poly(ctx, [0, -3, 26, -2, 26, 3, 0, 3], gold, out, 1.5);
  poly(ctx, [26, -2, 48, -1, 48, 3, 26, 3], gold, out, 1.5);
  // the wavy keris blade
  ctx.beginPath();
  ctx.moveTo(48, -3);
  for (let i = 0; i <= 6; i++) ctx.lineTo(54 + i * 6, (i % 2 ? -5 : 2) * (1 - i / 8));
  ctx.lineTo(90, 0);
  for (let i = 6; i >= 0; i--) ctx.lineTo(54 + i * 6, (i % 2 ? -1 : 5) * (1 - i / 8) + 1);
  ctx.closePath();
  ctx.fillStyle = paintFor(shadow, '#d8e2e8');
  ctx.fill();
  if (!shadow) { ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 1.5; ctx.stroke(); }
  rod(ctx, 46, 0, 46 + 6, 70, shadow);
  ctx.restore();
}

// ---- Ogres (buto): round eyes, bulb nose, fangs. Colour sets tell the kinds apart ----
export function drawButo(ctx, shadow, look = {}) {
  const face = paintFor(shadow, look.face ?? '#3f8a3a');
  const body = paintFor(shadow, look.body ?? PALETTE.goldDeep);
  const cloth = paintFor(shadow, look.cloth ?? PALETTE.redDeep);
  const hair = paintFor(shadow, PALETTE.ink);
  const out = shadow ? null : PALETTE.ink;
  const bob = look.bob ?? 0;

  rod(ctx, 0, -60, 0, 30, shadow);
  poly(ctx, [-16, -36, -4, -36, -12, 0, -28, 0], hair, out, 1.5);
  poly(ctx, [4, -36, 16, -36, 26, 0, 10, 0], hair, out, 1.5);
  poly(ctx, [-24, -44, 22, -44, 30, -16, -32, -12], cloth, out, 2);
  blob(ctx, 0, -58 + bob, 24, 20, body, out, 2);
  if (!shadow) tatahan(ctx, -16, -70 + bob, 30, 22, 'rgba(255,230,160,0.55)', 5);
  // wild hair
  poly(ctx, [-26, -86 + bob, -38, -60 + bob, -18, -66 + bob, -20, -96 + bob, -6, -100 + bob], hair, out, 1.5);
  // face
  blob(ctx, 4, -84 + bob, 18, 16, face, out, 2);
  blob(ctx, 22, -82 + bob, 9, 8, face, out, 2);
  if (!shadow) {
    blob(ctx, 8, -90 + bob, 7, 7, PALETTE.cream, PALETTE.ink, 1.5);
    blob(ctx, 10, -90 + bob, 3, 3, PALETTE.ink);
    poly(ctx, [6, -74 + bob, 9, -66 + bob, 12, -74 + bob], PALETTE.cream, PALETTE.ink, 1);
    poly(ctx, [14, -74 + bob, 17, -67 + bob, 19, -74 + bob], PALETTE.cream, PALETTE.ink, 1);
    ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -97 + bob); ctx.lineTo(16, -95 + bob); ctx.stroke();
  }
  poly(ctx, [-8, -98 + bob, 0, -112 + bob, 8, -100 + bob, 14, -110 + bob, 16, -96 + bob], paintFor(shadow, PALETTE.gold), out, 1.5);
  // clawed arms on rods
  ctx.save();
  ctx.translate(14, -62 + bob);
  ctx.rotate(look.arm ?? 0.4);
  poly(ctx, [0, -4, 30, -3, 32, 4, 0, 4], body, out, 1.5);
  poly(ctx, [30, -5, 38, -8, 36, 0, 40, 4, 30, 5], face, out, 1.5);
  rod(ctx, 34, 2, 34, 64, shadow);
  ctx.restore();
}

export function drawLelawa(ctx, shadow, flap = 0) {
  const wing = paintFor(shadow, '#4a2a5e');
  const body = paintFor(shadow, PALETTE.ink);
  const out = shadow ? null : PALETTE.gold;
  const f = Math.sin(flap) * 14;
  poly(ctx, [0, -30, -46, -46 - f, -40, -30 - f * 0.4, -30, -34, -22, -22, -10, -26], wing, out, 1.5);
  poly(ctx, [0, -30, 46, -46 - f, 40, -30 - f * 0.4, 30, -34, 22, -22, 10, -26], wing, out, 1.5);
  blob(ctx, 0, -30, 8, 12, body, out, 1.5);
  poly(ctx, [-6, -40, -9, -50, -2, -42], body, out, 1);
  poly(ctx, [6, -40, 9, -50, 2, -42], body, out, 1);
  if (!shadow) {
    blob(ctx, -3, -34, 2, 2, PALETTE.bad);
    blob(ctx, 3, -34, 2, 2, PALETTE.bad);
  }
  rod(ctx, 0, -18, 0, 20, shadow);
}

export function drawBanaspati(ctx, shadow, t = 0) {
  if (shadow) {
    blob(ctx, 0, -30, 20, 22, SHADOW);
    return;
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32;
    const len = 32 + Math.sin(t * 9 + i * 1.7) * 8;
    ctx.fillStyle = i % 2 ? '#ff8a1e' : '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(-10 + i * 3, -24);
    ctx.lineTo(Math.cos(a) * len, -30 + Math.sin(a) * len);
    ctx.lineTo(-4 + i * 3, -22);
    ctx.fill();
  }
  blob(ctx, 0, -28, 16, 17, '#f4e1c0', PALETTE.ink, 2);
  blob(ctx, -6, -31, 5, 6, PALETTE.ink);
  blob(ctx, 6, -31, 5, 6, PALETTE.ink);
  blob(ctx, -6, -31, 2, 2, '#ff6b1a');
  blob(ctx, 6, -31, 2, 2, '#ff6b1a');
  poly(ctx, [-8, -18, 8, -18, 6, -13, -6, -13], PALETTE.ink);
}

export function drawWewe(ctx, shadow, t = 0, alpha = 1) {
  ctx.globalAlpha *= alpha;
  const robe = paintFor(shadow, '#9fd3c9');
  const hair = paintFor(shadow, '#16201f');
  const out = shadow ? null : PALETTE.tealDeep;
  const sway = Math.sin(t * 3) * 5;
  poly(ctx, [-14, -70, 14, -70, 22 + sway, 0, 8, -8, 0, 2, -8, -8, -22 + sway, 0], robe, out, 1.5);
  poly(ctx, [-16, -96, 14, -98, 20, -50, 8 + sway, -30, -20 + sway, -36], hair, out, 1.5);
  blob(ctx, 4, -84, 9, 11, paintFor(shadow, '#e8f2ee'), out, 1.5);
  if (!shadow) {
    blob(ctx, 7, -86, 2.2, 2.2, PALETTE.bad);
    ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(4, -78); ctx.lineTo(10, -78); ctx.stroke();
  }
  rod(ctx, 0, -40, 0, 26, shadow);
  ctx.globalAlpha /= alpha;
}

export function drawGendruwo(ctx, shadow, t = 0) {
  drawButo(ctx, shadow, { face: '#5a3a2a', body: '#3b2418', cloth: '#1e1a3a', arm: 0.2 + Math.sin(t * 2) * 0.2, bob: Math.sin(t * 2) * 2 });
}

// ---- Boss: Raksasa Wesi, the Iron Ogre, plated and swinging a gada club ----
export function drawIronOgre(ctx, shadow, t = 0, plates = 4) {
  drawButo(ctx, shadow, { face: '#5c6b7a', body: '#3a4652', cloth: '#7c1a16', arm: -0.6 + Math.sin(t * 1.5) * 0.4 });
  if (shadow) return;
  for (let i = 0; i < 4; i++) {
    const x = -22 + i * 12;
    poly(ctx, [x, -70, x + 10, -70, x + 9, -52, x + 1, -52], i < plates ? '#aab7c4' : 'rgba(0,0,0,0.25)', PALETTE.ink, 1.5);
    if (i < plates) blob(ctx, x + 5, -61, 1.6, 1.6, PALETTE.ink);
  }
  ctx.save();
  ctx.translate(-20, -62);
  ctx.rotate(-0.9 + Math.sin(t * 1.5) * 0.4);
  poly(ctx, [0, -3, -36, -4, -36, 4, 0, 3], '#5a3416', PALETTE.ink, 1.5);
  blob(ctx, -44, 0, 11, 9, '#8c96a0', PALETTE.ink, 2);
  ctx.restore();
}

// ---- Boss: Sang Pemangsa Bulan, the Moon-Eater, a vast floating head swallowing the moon ----
export function drawMoonEater(ctx, shadow, t = 0, rage = 0) {
  const skin = paintFor(shadow, rage > 0.5 ? '#6b1f5e' : '#3b2f7a');
  const gold = paintFor(shadow, PALETTE.gold);
  const out = shadow ? null : PALETTE.ink;
  const jaw = 8 + Math.sin(t * 2.4) * 6;
  // crown of flames
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI + 0.25 + i * 0.33;
    const r = 66 + Math.sin(t * 4 + i) * 6;
    poly(ctx, [Math.cos(a - 0.12) * 44, -40 + Math.sin(a - 0.12) * 44, Math.cos(a) * r, -40 + Math.sin(a) * r, Math.cos(a + 0.12) * 44, -40 + Math.sin(a + 0.12) * 44], paintFor(shadow, i % 2 ? '#ff7b2e' : PALETTE.gold), null);
  }
  blob(ctx, 0, -40, 50, 44, skin, out, 3);
  if (!shadow) tatahan(ctx, -34, -78, 68, 26, 'rgba(255,215,120,0.45)', 6);
  // lower jaw holding the crescent moon
  poly(ctx, [-40, -18, 40, -18, 30, 8 + jaw, -30, 8 + jaw], skin, out, 3);
  if (!shadow) {
    // the stolen crescent moon, clenched in the jaw
    const my = -2 + jaw * 0.5;
    ctx.fillStyle = 'rgba(255, 243, 196, 0.35)';
    ctx.beginPath();
    ctx.arc(30, my, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(30, my, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(39, my - 5, 19, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) poly(ctx, [-30 + i * 12, -18, -24 + i * 12, -8, -18 + i * 12, -18], PALETTE.cream, PALETTE.ink, 1);
    blob(ctx, -18, -50, 12, 12, '#fff3c4', PALETTE.ink, 2);
    blob(ctx, 18, -50, 12, 12, '#fff3c4', PALETTE.ink, 2);
    blob(ctx, -16, -50, 5, 6, rage > 0.5 ? PALETTE.bad : PALETTE.ink);
    blob(ctx, 20, -50, 5, 6, rage > 0.5 ? PALETTE.bad : PALETTE.ink);
    poly(ctx, [-6, -42, 6, -42, 10, -26, -10, -26], '#2a1f55', PALETTE.ink, 1.5);
  }
  poly(ctx, [-30, -82, -18, -96, -6, -84, 6, -98, 18, -84, 30, -96, 34, -78, -34, -78], gold, out, 2);
}

// ---- The kayon (gunungan): the tree-of-life puppet that opens and closes every play ----
export function drawKayon(ctx, x, y, h, t = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  const s = h / 300;
  ctx.scale(s, s);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(0, -300);
    ctx.bezierCurveTo(70, -230, 120, -120, 110, -40);
    ctx.lineTo(110, 0);
    ctx.lineTo(-110, 0);
    ctx.lineTo(-110, -40);
    ctx.bezierCurveTo(-120, -120, -70, -230, 0, -300);
    ctx.closePath();
  };
  shape();
  const grad = ctx.createLinearGradient(0, -300, 0, 0);
  grad.addColorStop(0, '#c8322a');
  grad.addColorStop(0.6, '#8a1f1a');
  grad.addColorStop(1, '#3a120c');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  ctx.save();
  shape();
  ctx.clip();
  tatahan(ctx, -110, -300, 220, 300, 'rgba(255, 210, 120, 0.25)', 7);
  // tree of life
  const branch = (bx, by, ang, len, depth) => {
    const ex = bx + Math.cos(ang) * len;
    const ey = by + Math.sin(ang) * len;
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = depth * 1.6;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + Math.cos(ang + 0.5) * len * 0.5, by + Math.sin(ang + 0.5) * len * 0.5, ex, ey);
    ctx.stroke();
    if (depth <= 1) {
      ctx.fillStyle = (Math.floor(ex + ey) % 3) ? '#ffd23f' : '#2f8f87';
      ctx.beginPath();
      ctx.arc(ex, ey, 6 + Math.sin(t * 2 + ex) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    branch(ex, ey, ang - 0.45, len * 0.72, depth - 1);
    branch(ex, ey, ang + 0.45, len * 0.72, depth - 1);
  };
  branch(0, -40, -Math.PI / 2, 70, 5);
  // the gate at its foot
  poly(ctx, [-44, 0, -44, -46, 0, -70, 44, -46, 44, 0], '#3a120c', PALETTE.gold, 5);
  poly(ctx, [-30, 0, -30, -38, -2, -38, -2, 0], '#7a4a1c', PALETTE.gold, 3);
  poly(ctx, [2, 0, 2, -38, 30, -38, 30, 0], '#7a4a1c', PALETTE.gold, 3);
  ctx.restore();
  rod(ctx, 0, 0, 0, 60, false);
  ctx.restore();
}
