// The in-play HUD: night and goal, boss bar, score and irama, tembang list, incoming foes,
// health / lamp oil / gong meters, the gamelan beat lane and the controls strip.

import { PALETTE, NIGHTS, IRAMA_NAMES, LAMP, PLAYER } from './config.js';
import { FOE_KINDS } from './enemies.js';

export const SERIF = "Georgia, 'Times New Roman', serif";

export function panel(ctx, x, y, w, h, alpha = 0.86) {
  ctx.fillStyle = `rgba(26, 13, 8, ${alpha})`;
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(201, 154, 58, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 5);
  ctx.stroke();
}

export function text(ctx, str, x, y, size = 16, color = PALETTE.cream, weight = 700, align = 'left') {
  ctx.font = `${weight} ${size}px ${SERIF}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}

export function bar(ctx, x, y, w, h, ratio, color, back = 'rgba(255,255,255,0.12)') {
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

export function keycap(ctx, label, x, y, minW = 30) {
  ctx.font = `800 13px ${SERIF}`;
  const w = Math.max(minW, ctx.measureText(label).width + 14);
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 22, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 2, y + 19, w - 4, 3);
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 16);
  return w;
}

function tag(ctx, label, x, y, color) {
  ctx.font = `900 13px ${SERIF}`;
  const w = ctx.measureText(label).width + 14;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 20, 4);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 7, y + 15);
  return w;
}

// The seven nights as a row of dots: cleared, current, and the two boss nights ringed red.
function drawLakonDots(ctx, g, x0, y) {
  NIGHTS.forEach((n, i) => {
    const x = x0 + i * 22;
    if (i < NIGHTS.length - 1) {
      ctx.strokeStyle = 'rgba(242, 180, 55, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 7, y);
      ctx.lineTo(x + 15, y);
      ctx.stroke();
    }
    ctx.fillStyle = i < g.nightIndex ? PALETTE.gold : i === g.nightIndex ? PALETTE.cream : 'rgba(255,255,255,0.15)';
    ctx.strokeStyle = n.boss ? PALETTE.bad : PALETTE.goldDeep;
    ctx.lineWidth = n.boss ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.arc(x, y, i === g.nightIndex ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function drawNightPanel(ctx, g) {
  panel(ctx, 14, 22, 350, 132);
  text(ctx, `NIGHT ${g.nightIndex + 1} / ${NIGHTS.length}`, 28, 52, 26, PALETTE.gold, 900);
  drawLakonDots(ctx, g, 196, 44);
  text(ctx, g.night.title, 28, 74, 15, PALETTE.cream, 600);
  const remaining = g.queue.length + g.foes.length + (g.boss || g.bossPending ? 1 : 0);
  const done = 1 - remaining / Math.max(1, g.nightTotal + 2);
  bar(ctx, 28, 84, 320, 9, done, PALETTE.teal);
  let w = tag(ctx, 'WIN', 28, 102, PALETTE.good);
  text(ctx, 'survive 7 nights, drive off the Moon-Eater', 28 + w + 6, 117, 13, PALETTE.cream, 600);
  w = tag(ctx, 'LOSE', 28, 126, PALETTE.bad);
  text(ctx, 'lamp oil or hero health hits 0', 28 + w + 6, 141, 13, PALETTE.cream, 600);
}

function drawIncoming(ctx, g) {
  const counts = {};
  for (const k of g.queue) counts[k] = (counts[k] || 0) + 1;
  for (const f of g.foes) counts[f.kind] = (counts[f.kind] || 0) + 1;
  const kinds = Object.keys(counts);
  const h = 42 + kinds.length * 36;
  panel(ctx, 14, 164, 240, h);
  text(ctx, 'INCOMING', 28, 188, 15, PALETTE.gold, 900);
  text(ctx, `${g.queue.length} still to come`, 240, 188, 12, PALETTE.cream, 600, 'right');
  kinds.forEach((k, i) => {
    const y = 212 + i * 36;
    ctx.fillStyle = FOE_KINDS[k].color;
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(36, y - 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    text(ctx, FOE_KINDS[k].name, 52, y, 14, PALETTE.cream, 800);
    text(ctx, FOE_KINDS[k].behaviour, 52, y + 15, 11, 'rgba(255,244,220,0.7)', 600);
    text(ctx, `x${counts[k]}`, 240, y + 4, 17, PALETTE.gold, 900, 'right');
  });
}

function drawBossBar(ctx, g) {
  const b = g.bossInfo();
  if (!b) return;
  const x = 380; const w = 520;
  panel(ctx, x, 22, w, b.pending ? 50 : 76);
  if (b.pending) {
    text(ctx, `${b.def.name} approaches...`, x + w / 2, 54, 18, PALETTE.bad, 900, 'center');
    return;
  }
  text(ctx, b.def.name, x + 16, 48, 19, PALETTE.bad, 900);
  text(ctx, `PHASE ${b.phase + 1}/3 · ${b.def.phases[b.phase]}`, x + w - 16, 48, 14, PALETTE.gold, 800, 'right');
  bar(ctx, x + 16, 56, w - 32, 13, b.hp / b.maxHp, '#d0352b');
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  for (const k of [1 / 3, 2 / 3]) {
    ctx.beginPath();
    ctx.moveTo(x + 16 + (w - 32) * k, 54);
    ctx.lineTo(x + 16 + (w - 32) * k, 71);
    ctx.stroke();
  }
  text(ctx, b.def.rule, x + w / 2, 89, 13, PALETTE.cream, 600, 'center');
}

function drawScorePanel(ctx, g) {
  const x = 936; const w = 330;
  panel(ctx, x, 22, w, 112);
  text(ctx, 'SCORE', x + 16, 44, 13, PALETTE.gold, 800);
  text(ctx, g.score.toLocaleString('en-US'), x + 16, 80, 36, PALETTE.cream, 900);
  text(ctx, `BEST ${Math.max(g.save.best, g.score).toLocaleString('en-US')}`, x + w - 16, 44, 13, PALETTE.gold, 700, 'right');
  text(ctx, `IRAMA ${IRAMA_NAMES[g.irama]}`, x + 16, 106, 15, PALETTE.good, 900);
  text(ctx, `x${g.irama + 1}`, x + w - 16, 106, 22, PALETTE.good, 900, 'right');
  const next = [4, 9, 15, 23][g.irama];
  bar(ctx, x + 16, 114, w - 32, 7, next ? g.streak / next : 1, PALETTE.good);
}

function drawTembangPanel(ctx, g) {
  const list = g.ownedTembang();
  const x = 1036; const w = 230;
  const rows = list.slice(0, 9);
  const h = 44 + Math.max(1, rows.length) * 33;
  panel(ctx, x, 144, w, h);
  text(ctx, `TEMBANG ${list.length}/12`, x + 14, 168, 15, PALETTE.gold, 900);
  text(ctx, 'songs learned', x + w - 14, 168, 11, PALETTE.cream, 600, 'right');
  if (!list.length) text(ctx, 'learn songs between nights', x + 14, 192, 12, PALETTE.cream, 600);
  rows.forEach((t, i) => {
    const y = 192 + i * 33;
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.roundRect(x + 14, y - 14, 20, 20, 4);
    ctx.fill();
    text(ctx, t.icon, x + 24, y + 1, 11, PALETTE.ink, 900, 'center');
    text(ctx, t.name, x + 42, y, 13, PALETTE.cream, 800);
    text(ctx, t.text, x + 42, y + 14, 10, 'rgba(255,244,220,0.7)', 600);
  });
}

function drawMeters(ctx, g) {
  const p = g.player;
  panel(ctx, 14, 664, 300, 122);
  text(ctx, 'HERO', 28, 688, 13, PALETTE.gold, 800);
  text(ctx, `${Math.ceil(p.hp)} / ${p.maxHp}`, 300, 688, 13, PALETTE.cream, 700, 'right');
  bar(ctx, 28, 694, 272, 12, p.hp / p.maxHp, '#d0352b');
  text(ctx, 'LAMP OIL', 28, 724, 13, PALETTE.gold, 800);
  text(ctx, `${Math.ceil(g.lamp.oil)} / ${LAMP.maxOil}`, 300, 724, 13, PALETTE.cream, 700, 'right');
  bar(ctx, 28, 730, 272, 12, g.lamp.oil / LAMP.maxOil, '#ffb84a');
  const ready = p.gong >= PLAYER.gongCost;
  text(ctx, ready ? 'GONG READY · RMB' : 'GONG', 28, 760, 13, ready ? '#ffd23f' : PALETTE.gold, 800);
  bar(ctx, 28, 766, 272, 10, p.gong / PLAYER.gongCost, ready ? '#ffd23f' : '#9a6bd8');
}

function drawBeatLane(ctx, g) {
  const cx = 640; const y = 744; const w = 420;
  panel(ctx, cx - w / 2 - 14, 704, w + 28, 82);
  text(ctx, `GAMELAN ${g.clock.bpm} BPM · strike as the notes meet the gong`, cx, 724, 13, PALETTE.gold, 700, 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(cx - w / 2, y - 3, w, 26);
  const ph = g.clock.phase();
  const spacing = 64;
  for (let i = 0; i < 4; i++) {
    const off = (i + 1 - ph) * spacing;
    const alpha = 1 - off / (spacing * 4.2);
    ctx.fillStyle = `rgba(255, 210, 63, ${alpha})`;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx + s * off, y + 10, i === 3 ? 6 : 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const pulse = g.beatFlash;
  ctx.fillStyle = PALETTE.redDeep;
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, y + 10, 16 + pulse * 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(cx, y + 10, 6, 0, Math.PI * 2);
  ctx.fill();
  const rate = g.stats.actions ? Math.round((g.stats.onBeat / g.stats.actions) * 100) : 0;
  text(ctx, `ON BEAT ${rate}%`, cx - w / 2 + 4, y + 40, 12, PALETTE.cream, 700);
  text(ctx, `CHAIN ${g.chainTimer > 0 ? g.chain : 0}`, cx + w / 2 - 4, y + 40, 12, PALETTE.cream, 700, 'right');
}

function drawControls(ctx) {
  const x0 = 956; const y = 690;
  panel(ctx, x0 - 10, 664, 330, 122);
  const rows = [
    [['WASD', 'MOVE'], ['SPACE', 'DASH']],
    [['LMB', 'KERIS'], ['RMB', 'GONG']],
    [['P', 'PAUSE'], ['M', 'SOUND'], ['R', 'RESTART']],
  ];
  rows.forEach((row, ri) => {
    let x = x0 + 4;
    for (const [k, label] of row) {
      const w = keycap(ctx, k, x, y - 6 + ri * 32);
      text(ctx, label, x + w + 6, y + 10 + ri * 32, 13, PALETTE.cream, 700);
      x += w + 6 + ctx.measureText(label).width + 16;
    }
  });
}

export function drawHud(ctx, g) {
  drawNightPanel(ctx, g);
  drawIncoming(ctx, g);
  drawBossBar(ctx, g);
  drawScorePanel(ctx, g);
  drawTembangPanel(ctx, g);
  drawMeters(ctx, g);
  drawBeatLane(ctx, g);
  drawControls(ctx);
}
