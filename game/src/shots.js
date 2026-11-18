// Staged scenes for the maker's screenshots (?shot=title|play|draft|end). Each one sets up a
// moment of a run, lets the game's own update loop play into it with a scripted hand, and holds.

import { TEMBANG } from './upgrades.js';
import { Boss } from './bosses.js';
import { angleTo } from './rng.js';

function scriptedHand(game) {
  const hand = {
    mouse: { x: 700, y: 400, left: false, right: false, leftPressed: false, rightPressed: false },
    axis: { x: 0, y: 0 },
    keys: new Set(),
    moveAxis: () => hand.axis,
    down: (c) => hand.keys.has(c),
    hit: (c) => hand.keys.has(c),
  };
  hand.aimAtNearest = () => {
    const p = game.player;
    const list = game.targets();
    if (!list.length) return;
    list.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    hand.mouse.x = list[0].x;
    hand.mouse.y = list[0].cy;
  };
  return hand;
}

function learn(game, ids) {
  for (const id of ids) {
    const t = TEMBANG.find((x) => x.id === id);
    t.apply(game.mods);
    game.owned.push(id);
  }
}

function simulate(game, hand, seconds, slashOnBeat = true) {
  const dt = 1 / 60;
  let lastBeat = game.clock.beatIndex;
  for (let i = 0; i < seconds * 60; i++) {
    hand.aimAtNearest();
    hand.mouse.leftPressed = false;
    if (slashOnBeat && game.clock.beatIndex !== lastBeat) {
      lastBeat = game.clock.beatIndex;
      hand.mouse.leftPressed = true;
    }
    game.update(dt, hand);
  }
}

function stagePlay(game, hand) {
  game.diffIndex = 1;
  game.startRun();
  learn(game, ['keris', 'twin', 'saron', 'echo', 'kendang', 'irama', 'minyak']);
  game.score = 186420;
  game.stats.kills = 311;
  game.stats.actions = 640;
  game.stats.onBeat = 431;
  game.startNight(6);
  game.effects.callouts = [];
  game.queue = game.queue.slice(4);
  game.bossPending = null;
  game.boss = new Boss('moonEater', game.diff);
  game.boss.hp = game.boss.maxHp * 0.52;
  game.boss.x = 960;
  game.boss.y = 270;
  game.boss.t = 2.4;
  game.player.x = 560;
  game.player.y = 600;
  game.player.hp = 96;
  game.player.gong = 100;
  game.lamp.oil = 71;
  game.streak = 17;
  game.irama = 3;
  game.stats.bestIrama = 3;
  const spots = [
    ['buto', 400, 540], ['buto', 760, 660], ['buto', 900, 470], ['lelawa', 470, 440], ['lelawa', 700, 330],
    ['banaspati', 250, 330], ['banaspati', 1000, 600], ['wewe', 820, 540], ['gendruwo', 300, 660], ['lelawa', 560, 280],
    ['buto', 1080, 420], ['wewe', 380, 400],
  ];
  for (const [k, x, y] of spots) game.spawnFoe(k, x, y);
  simulate(game, hand, 0.9);
  game.boss.x = 790;
  game.boss.y = 330;
  game.effects.texts = game.effects.texts.filter((t) => t.text !== 'ON BEAT');
  game.clock.time = 0.01;
  hand.aimAtNearest();
  hand.mouse.leftPressed = true;
  game.player.slashCd = 0;
  game.update(1 / 60, hand);
  game.effects.callout('CHAIN x4!', '#ff8a3a');
  game.effects.callout('IRAMA WILET', '#7fd36a', 'score x4');
  game.time = 3.3;
}

function stageDraft(game, hand) {
  game.diffIndex = 1;
  game.startRun();
  learn(game, ['keris', 'saron']);
  game.road = 'garagara';
  game.stats.tookGaragara = true;
  game.startNight(2);
  game.foes = [];
  game.queue = [];
  game.score = 48210;
  game.stats.kills = 96;
  game.stats.bestIrama = 3;
  game.lamp.oil = 84;
  game.player.hp = 101;
  simulate(game, hand, 0.2);
  game.draft.extra = 0;
  game.pickTembang(1);
}

function stageEnd(game) {
  game.diffIndex = 1;
  game.startRun();
  learn(game, ['keris', 'twin', 'saron', 'echo', 'kendang', 'irama', 'minyak', 'rebab']);
  game.nightIndex = 6;
  game.foes = [];
  game.queue = [];
  game.bossPending = null;
  game.bossDefeated = ['ironOgre', 'moonEater'];
  game.score = 251380;
  Object.assign(game.stats, { kills: 402, actions: 905, onBeat: 642, bestIrama: 4, bestChain: 11, time: 1067, cleanNights: 2, lowestOil: 58, tookGaragara: true });
  game.save.runs = [{ score: 203110, grade: 'A', won: true, night: 7, diff: 'GAGAH' }, { score: 96400, grade: 'B', won: false, night: 5, diff: 'GAGAH' }, { score: 31250, grade: 'C', won: false, night: 3, diff: 'ALUS' }];
  game.save.best = 203110;
  game.endRun(true, 'The Moon-Eater is driven off and dawn comes');
}

export function stageScene(game, scene, realInput) {
  const hand = scriptedHand(game);
  game.save = { best: 0, runs: [], plays: 0, ...game.save };
  if (scene === 'play') stagePlay(game, hand);
  else if (scene === 'draft') stageDraft(game, hand);
  else if (scene === 'end') stageEnd(game);
  else {
    game.state = 'title';
    game.time = 1.2;
    game.save.best = 251380;
    game.save.runs = [{ score: 251380, grade: 'S', won: true, night: 7, diff: 'GAGAH' }];
  }
  void realInput;
  void angleTo;
}
