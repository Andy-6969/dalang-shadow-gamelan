// Menus: the title screen, the between-nights draft (tembang and road), the results screen and
// pause. Each screen registers clickable buttons; keys mirror every button.

import { PALETTE, NIGHTS, DIFFICULTIES, VIEW_W, VIEW_H, IRAMA_NAMES } from './config.js';
import { panel, text, keycap, SERIF } from './hud.js';
import { ROADS } from './upgrades.js';
import { FOE_KINDS } from './enemies.js';
import { drawKayon, drawWithShadow, drawSatria, drawButo, drawMoonEater, drawLelawa, drawBanaspati, drawWewe, drawGendruwo } from './puppets.js';

export const buttons = [];

function button(ctx, label, key, x, y, w, h, action, primary = false) {
  buttons.push({ x, y, w, h, action });
  ctx.fillStyle = primary ? PALETTE.gold : 'rgba(26, 13, 8, 0.9)';
  ctx.strokeStyle = primary ? PALETTE.cream : PALETTE.panelEdge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + (primary ? 12 : 7), primary ? 34 : 20, primary ? PALETTE.ink : PALETTE.cream, 900, 'center');
  if (key) text(ctx, key, x + w / 2, y + h - 8, 12, primary ? PALETTE.redDeep : PALETTE.gold, 700, 'center');
}

function logo(ctx, x, y, size) {
  ctx.font = `900 ${size}px ${SERIF}`;
  ctx.textAlign = 'left';
  ctx.lineWidth = size / 7;
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeText('DALANG', x, y);
  const g = ctx.createLinearGradient(0, y - size, 0, y);
  g.addColorStop(0, '#fff1b0');
  g.addColorStop(0.5, PALETTE.gold);
  g.addColorStop(1, PALETTE.goldDeep);
  ctx.fillStyle = g;
  ctx.fillText('DALANG', x, y);
}

export function drawTitle(ctx, g) {
  const t = g.time;
  ctx.fillStyle = 'rgba(26, 13, 8, 0.35)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // the showcase on the right: kayon, hero, ogre and the Moon-Eater
  drawKayon(ctx, 930, 640, 520, t, 1);
  drawWithShadow(ctx, 760, 690, 2.3, 1, (c, sh) => drawSatria(c, sh, { armAngle: -0.4 + Math.sin(t * 2) * 0.1 }));
  drawWithShadow(ctx, 1150, 700, 1.7, -1, (c, sh) => drawButo(c, sh, { bob: Math.sin(t * 3) * 3, arm: 0.2 }));
  drawWithShadow(ctx, 1080, 300, 1.1, 1, (c, sh) => drawMoonEater(c, sh, t, 0));

  panel(ctx, 30, 30, 560, 740, 0.88);
  logo(ctx, 56, 128, 104);
  text(ctx, 'shadow puppets to the gamelan beat', 60, 162, 22, PALETTE.cream, 600);
  const lines = [
    ['GOAL', PALETTE.gold, 'you are the dalang: guard the blencong lamp through 7 nights'],
    ['WIN', PALETTE.good, 'drive off the Moon-Eater at the end of night 7'],
    ['LOSE', PALETTE.bad, 'the lamp runs out of oil or the hero falls'],
    ['BEAT', '#ffe08a', 'strike as the gamelan hits: ON BEAT = x2 damage'],
  ];
  lines.forEach(([tg, col, str], i) => {
    const y = 200 + i * 30;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(60, y, 58, 22, 4);
    ctx.fill();
    text(ctx, tg, 89, y + 16, 13, PALETTE.ink, 900, 'center');
    text(ctx, str, 128, y + 16, 15, PALETTE.cream, 600);
  });

  text(ctx, 'DIFFICULTY  · keys 1 2 3', 60, 352, 14, PALETTE.gold, 800);
  DIFFICULTIES.forEach((d, i) => {
    const x = 60 + i * 172; const y = 362; const w = 160; const h = 64;
    const on = i === g.diffIndex;
    buttons.push({ x, y, w, h, action: `diff:${i}` });
    ctx.fillStyle = on ? 'rgba(242, 180, 55, 0.25)' : 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = on ? PALETTE.gold : 'rgba(201,154,58,0.4)';
    ctx.lineWidth = on ? 3 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    text(ctx, `${d.key} · ${d.name}`, x + 12, y + 26, 18, on ? PALETTE.gold : PALETTE.cream, 900);
    text(ctx, d.blurb, x + 12, y + 48, 11, PALETTE.cream, 600);
  });

  button(ctx, 'PLAY', 'ENTER or CLICK', 60, 446, 504, 82, 'play', true);

  text(ctx, 'CONTROLS', 60, 560, 14, PALETTE.gold, 800);
  const ctl = [['WASD', 'move'], ['MOUSE', 'aim'], ['LMB', 'keris slash'], ['RMB', 'gong blast'], ['SPACE', 'dash'], ['P', 'pause']];
  ctl.forEach(([k, label], i) => {
    const x = 60 + (i % 3) * 170; const y = 572 + Math.floor(i / 3) * 30;
    const w = keycap(ctx, k, x, y);
    text(ctx, label, x + w + 8, y + 16, 14, PALETTE.cream, 600);
  });

  text(ctx, 'THE LAKON', 60, 660, 14, PALETTE.gold, 800);
  text(ctx, '7 nights · 21 night goals · 2 bosses · 5 foes · 12 tembang · 2 roads · 3 difficulties', 60, 682, 13, PALETTE.cream, 600);
  text(ctx, `BEST ${g.save.best.toLocaleString('en-US')}`, 60, 716, 18, PALETTE.gold, 900);
  if (g.save.runs.length) {
    const r = g.save.runs[0];
    text(ctx, `LAST RUN ${r.grade} · ${r.score.toLocaleString('en-US')} · ${r.won ? 'DAWN' : `night ${r.night}`} · ${r.diff}`, 60, 740, 13, PALETTE.cream, 600);
  } else {
    text(ctx, 'no runs yet: the screen is waiting', 60, 740, 13, PALETTE.cream, 600);
  }
  // bestiary strip
  panel(ctx, 620, 712, 630, 64, 0.8);
  const kinds = Object.keys(FOE_KINDS);
  kinds.forEach((k, i) => {
    const x = 660 + i * 122;
    ctx.save();
    ctx.translate(x, 764);
    ctx.scale(0.36, 0.36);
    if (k === 'buto') drawButo(ctx, false, {});
    if (k === 'lelawa') drawLelawa(ctx, false, t * 10);
    if (k === 'banaspati') drawBanaspati(ctx, false, t);
    if (k === 'wewe') drawWewe(ctx, false, t, 1);
    if (k === 'gendruwo') drawGendruwo(ctx, false, t);
    ctx.restore();
    text(ctx, FOE_KINDS[k].name, x + 18, 752, 12, PALETTE.cream, 700);
  });
}

function nightPath(ctx, g, y, x0 = 200, step = 146) {
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + step * 6, y);
  ctx.stroke();
  ctx.setLineDash([]);
  NIGHTS.forEach((n, i) => {
    const x = x0 + i * step;
    const done = i <= g.nightIndex;
    const next = i === g.nightIndex + 1;
    ctx.fillStyle = done ? PALETTE.gold : next ? PALETTE.cream : 'rgba(255,255,255,0.15)';
    ctx.strokeStyle = n.boss ? PALETTE.bad : PALETTE.ink;
    ctx.lineWidth = n.boss ? 4 : 2;
    ctx.beginPath();
    ctx.arc(x, y, next ? 22 : 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    text(ctx, n.boss ? '☠' : `${i + 1}`, x, y + 6, 17, PALETTE.ink, 900, 'center');
    text(ctx, n.boss ? (n.boss === 'ironOgre' ? 'IRON OGRE' : 'MOON-EATER') : next ? 'NEXT' : done ? 'CLEARED' : `NIGHT ${i + 1}`, x, y + 42, 11, n.boss ? PALETTE.bad : PALETTE.cream, 800, 'center');
  });
}

export function drawDraft(ctx, g) {
  const d = g.draft;
  ctx.fillStyle = 'rgba(20, 10, 6, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, `NIGHT ${g.nightIndex + 1} / ${NIGHTS.length} CLEARED`, VIEW_W / 2, 74, 50, PALETTE.gold, 900, 'center');
  const goalsDone = g.goals.filter((goal) => goal.done).length;
  text(ctx, `dawn bonus +${d.bonus.toLocaleString('en-US')} · night goals ${goalsDone}/${g.goals.length} · score ${g.score.toLocaleString('en-US')} · ${g.stats.kills} foes cut down`, VIEW_W / 2, 106, 17, PALETTE.cream, 600, 'center');

  const learning = !d.picked;
  text(ctx, `1 · LEARN A TEMBANG ${d.extra ? '(Gara-gara gift: pick twice)' : ''}   keys 1 2 3`, 60, 156, 20, learning ? PALETTE.gold : 'rgba(255,244,220,0.5)', 900);
  d.choices.forEach((tb, i) => {
    const x = 60 + i * 280; const y = 172; const w = 264; const h = 220;
    const chosen = d.picked === tb.id;
    if (learning) buttons.push({ x, y, w, h, action: `tembang:${i}` });
    panel(ctx, x, y, w, h, 0.95);
    if (chosen) { ctx.strokeStyle = PALETTE.good; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4); }
    keycap(ctx, `${i + 1}`, x + 12, y + 12);
    ctx.fillStyle = tb.color;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 76, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    ctx.stroke();
    text(ctx, tb.icon, x + w / 2, y + 88, 32, PALETTE.ink, 900, 'center');
    text(ctx, tb.name, x + w / 2, y + 150, 21, PALETTE.cream, 900, 'center');
    text(ctx, tb.text, x + w / 2, y + 178, 14, PALETTE.cream, 600, 'center');
    const n = g.owned.filter((id) => id === tb.id).length;
    text(ctx, n ? `owned x${n}` : 'NEW', x + w / 2, y + 204, 12, n ? PALETTE.gold : PALETTE.good, 800, 'center');
  });

  const rx = 920;
  text(ctx, '2 · CHOOSE THE ROAD   Q E', rx, 156, 20, learning ? 'rgba(255,244,220,0.5)' : PALETTE.gold, 900);
  ROADS.forEach((r, i) => {
    const y = 172 + i * 112; const w = 300; const h = 100;
    if (!learning) buttons.push({ x: rx, y, w, h, action: `road:${r.id}` });
    panel(ctx, rx, y, w, h, 0.95);
    keycap(ctx, r.key, rx + 12, y + 12);
    text(ctx, r.name, rx + 54, y + 30, 21, r.color, 900);
    const words = r.text.split(' ');
    let line = ''; let ly = y + 56;
    for (const wd of words) {
      if ((line + wd).length > 36) { text(ctx, line, rx + 14, ly, 13, PALETTE.cream, 600); line = ''; ly += 18; }
      line += `${wd} `;
    }
    text(ctx, line, rx + 14, ly, 13, PALETTE.cream, 600);
  });

  panel(ctx, 80, 420, 1120, 170, 0.9);
  text(ctx, 'THE LAKON', 104, 470, 16, PALETTE.gold, 900);
  nightPath(ctx, g, 520);
  const nextNight = NIGHTS[g.nightIndex + 1];
  // tonight's goals, settled at dawn
  panel(ctx, 80, 610, 520, 150, 0.9);
  text(ctx, `NIGHT GOALS ${goalsDone}/${g.goals.length}`, 104, 640, 16, PALETTE.gold, 900);
  g.goals.forEach((goal, i) => {
    const y = 674 + i * 28;
    ctx.fillStyle = goal.done ? PALETTE.good : 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(104, y - 15, 18, 18, 4);
    ctx.fill();
    if (goal.done) text(ctx, '✓', 113, y, 14, PALETTE.ink, 900, 'center');
    text(ctx, goal.text, 132, y, 15, goal.done ? PALETTE.cream : 'rgba(255,244,220,0.5)', 700);
    text(ctx, goal.done ? `+${Math.round(goal.bonus * g.diff.scoreMul * (g.nightIndex + 1) * 0.5).toLocaleString('en-US')}` : 'missed', 580, y, 14, goal.done ? PALETTE.good : PALETTE.bad, 800, 'right');
  });
  panel(ctx, 620, 610, 580, 150, 0.9);
  text(ctx, `NEXT · NIGHT ${g.nightIndex + 2}`, 644, 640, 16, PALETTE.gold, 900);
  text(ctx, `${nextNight.title} · gamelan ${nextNight.bpm} BPM`, 644, 668, 16, PALETTE.cream, 700);
  const owned = g.ownedTembang();
  text(ctx, `TEMBANG ${owned.length}: ${owned.map((t) => t.name).join(' · ') || 'none yet'}`, 644, 698, 13, PALETTE.gold, 600);
  text(ctx, `HERO ${Math.ceil(g.player.hp)}/${g.player.maxHp}  ·  LAMP OIL ${Math.ceil(g.lamp.oil)}  ·  BEST IRAMA ${IRAMA_NAMES[g.stats.bestIrama]}`, 644, 732, 15, PALETTE.cream, 700);
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export function drawResults(ctx, g) {
  const r = g.result;
  ctx.fillStyle = 'rgba(20, 10, 6, 0.84)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, r.victory ? 'DAWN · VICTORY' : 'THE SCREEN GOES DARK', VIEW_W / 2, 80, 58, r.victory ? PALETTE.gold : PALETTE.bad, 900, 'center');
  text(ctx, `${r.reason} · ${r.diff} · night ${r.night} of ${NIGHTS.length}`, VIEW_W / 2, 116, 19, PALETTE.cream, 600, 'center');

  // grade medallion with a dawn sunburst behind it
  const mx = 210; const my = 300;
  if (r.victory) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + g.time * 0.1;
      ctx.fillStyle = i % 2 ? 'rgba(255, 210, 63, 0.22)' : 'rgba(232, 90, 58, 0.18)';
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.arc(mx, my, 190, a, a + Math.PI / 16);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = r.victory ? PALETTE.gold : '#8c96a0';
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(mx, my, 104, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = PALETTE.redDeep;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(mx, my, 88, 0, Math.PI * 2);
  ctx.stroke();
  text(ctx, r.grade, mx, my + 42, 128, PALETTE.ink, 900, 'center');
  text(ctx, 'GRADE', mx, my + 136, 16, PALETTE.gold, 800, 'center');

  text(ctx, 'SCORE', 360, 176, 15, PALETTE.gold, 800);
  text(ctx, r.score.toLocaleString('en-US'), 360, 232, 60, PALETTE.cream, 900);
  if (r.newBest) text(ctx, 'NEW BEST!', 680, 232, 22, PALETTE.good, 900);
  const s = g.stats;
  const rate = s.actions ? Math.round((s.onBeat / s.actions) * 100) : 0;
  const cells = [
    ['FOES CUT', `${s.kills}`], ['ON BEAT', `${rate}%`], ['BEST IRAMA', IRAMA_NAMES[s.bestIrama]],
    ['BEST CHAIN', `x${s.bestChain}`], ['TIME', fmtTime(s.time)], ['NIGHT GOALS', `${s.goalsDone}/21`],
  ];
  cells.forEach(([k, v], i) => {
    const x = 360 + (i % 3) * 170; const y = 262 + Math.floor(i / 3) * 84;
    panel(ctx, x, y, 158, 72, 0.9);
    text(ctx, k, x + 12, y + 24, 12, PALETTE.gold, 800);
    text(ctx, v, x + 12, y + 56, 26, PALETTE.cream, 900);
  });

  const fx = 900;
  panel(ctx, fx, 160, 340, 330, 0.9);
  const feats = r.feats;
  text(ctx, `FEATS ${feats.filter((f) => f.done).length}/${feats.length}`, fx + 16, 190, 16, PALETTE.gold, 900);
  feats.forEach((f, i) => {
    const y = 222 + i * 33;
    ctx.fillStyle = f.done ? PALETTE.good : 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(fx + 16, y - 15, 20, 20, 4);
    ctx.fill();
    if (f.done) text(ctx, '✓', fx + 26, y + 1, 15, PALETTE.ink, 900, 'center');
    text(ctx, f.text, fx + 46, y, 13, f.done ? PALETTE.cream : 'rgba(255,244,220,0.45)', 700);
  });

  panel(ctx, 80, 520, 760, 150, 0.9);
  text(ctx, 'THE LAKON', 104, 548, 15, PALETTE.gold, 900);
  nightPath(ctx, { nightIndex: r.night - (r.victory ? 1 : 2) }, 594, 140, 112);
  panel(ctx, 900, 520, 340, 150, 0.9);
  text(ctx, 'LAST RUNS', 916, 548, 15, PALETTE.gold, 900);
  g.save.runs.slice(0, 4).forEach((run, i) => {
    text(ctx, `${run.grade}  ${run.score.toLocaleString('en-US')}  ${run.won ? 'DAWN' : `night ${run.night}`}  ${run.diff}`, 916, 578 + i * 24, 14, PALETTE.cream, 700);
  });
  text(ctx, `BEST ${g.save.best.toLocaleString('en-US')}`, 1224, 548, 15, PALETTE.gold, 900, 'right');

  button(ctx, 'PLAY AGAIN', 'R', 380, 694, 300, 78, 'play', true);
  button(ctx, 'TITLE & DIFFICULTY', 'T', 700, 704, 300, 62, 'title');
}

export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(20, 10, 6, 0.7)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'PAUSED', VIEW_W / 2, 360, 72, PALETTE.gold, 900, 'center');
  text(ctx, 'P to resume · R to restart · T for the title', VIEW_W / 2, 410, 20, PALETTE.cream, 600, 'center');
}
