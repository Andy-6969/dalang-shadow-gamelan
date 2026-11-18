// One run of DALANG: seven nights of the shadow play. Holds the state machine (title, night,
// draft, results), the beat-scored combat rules, spawning, the lamp, scoring and feats.

import { NIGHTS, DIFFICULTIES, LAMP, LAMP_X, LAMP_Y, PLAYER, IRAMA_STEPS, IRAMA_NAMES } from './config.js';
import { makeRng, dist, angleTo, angleDiff } from './rng.js';
import { BeatClock } from './rhythm.js';
import { Effects } from './effects.js';
import { Player } from './player.js';
import { Foe, Bolt } from './enemies.js';
import { Boss, BOSS_KINDS } from './bosses.js';
import { baseMods, draftChoices, tembangById } from './upgrades.js';
import { loadSave, recordRun } from './save.js';

export class Game {
  constructor(audio, seed = 7) {
    this.audio = audio;
    this.rng = makeRng(seed);
    this.save = loadSave();
    this.state = 'title';
    this.diffIndex = 1;
    this.paused = false;
    this.time = 0;
    this.titleT = 0;
    this.effects = new Effects(this.rng);
    this.clock = new BeatClock(84);
    this.clock.onBeat((i) => this.onBeat(i));
    this.beatFlash = 0;
    this.resetRun();
  }

  get diff() { return DIFFICULTIES[this.diffIndex]; }
  get night() { return NIGHTS[this.nightIndex]; }

  resetRun() {
    this.player = new Player();
    this.lamp = { oil: LAMP.maxOil, flare: 0 };
    this.mods = baseMods();
    this.owned = [];
    this.foes = [];
    this.bolts = [];
    this.boss = null;
    this.bossDefeated = [];
    this.nightIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.irama = 0;
    this.chain = 0;
    this.chainTimer = 0;
    this.road = null;
    this.roads = [];
    this.stats = { kills: 0, actions: 0, onBeat: 0, bestIrama: 0, bestChain: 0, time: 0, hitsTaken: 0, cleanNights: 0, lowestOil: 100, tookGaragara: false };
    this.result = null;
    this.draft = null;
  }

  startRun() {
    this.resetRun();
    this.state = 'play';
    this.startNight(0);
  }

  startNight(i) {
    this.nightIndex = i;
    const n = this.night;
    this.clock.setBpm(n.bpm);
    this.clock.time = 0;
    this.queue = [];
    const surge = this.road === 'garagara' ? 1.4 : 1;
    for (const [kind, count] of n.verses) {
      for (let k = 0; k < Math.round(count * surge); k++) this.queue.push(kind);
    }
    this.bossPending = n.boss || null;
    this.boss = null;
    this.spawnTimer = 1.5;
    this.nightHits = 0;
    this.nightTotal = this.queue.length + (this.bossPending ? 1 : 0);
    this.player.shieldLeft = this.mods.shield;
    this.effects.callout(`NIGHT ${i + 1}`, '#ffe08a', n.title);
  }

  // ---- beats ----
  onBeat(i) {
    this.beatFlash = 1;
    if (this.state !== 'play' || this.paused) {
      if (this.state === 'title') this.audio.playBeat(i, 0, 1);
      return;
    }
    this.audio.playBeat(i, this.nightIndex, this.irama + 1);
    for (const f of this.foes) f.onBeat(this, i);
    if (this.boss) this.boss.onBeat(this, i);
  }

  // ---- actions ----
  playerAction(kind) {
    const p = this.player;
    const onBeat = this.clock.isOnBeat(this.diff.beatWindow + this.mods.beatWindow);
    this.stats.actions += 1;
    if (onBeat) {
      this.stats.onBeat += 1;
      this.streak += 1;
      if (p.beatGlow < 0.6) this.effects.floatText(p.x, p.y - 150, 'ON BEAT', '#ffe08a', 20);
      p.beatGlow = 1;
    } else {
      this.streak = Math.max(0, this.streak - 2);
    }
    this.updateIrama();
    const iramaMul = 1 + this.irama * 0.15;

    if (kind === 'slash') {
      const range = PLAYER.slashRange * this.mods.slashRange;
      const arc = PLAYER.slashArc * this.mods.slashArc;
      p.slashFx = { angle: p.aim, life: 0.16, onBeat, range, arc };
      this.audio.sfx(onBeat ? 'beatSlash' : 'slash');
      const dmg = PLAYER.slashDamage * this.mods.damage * (onBeat ? 2 : 1) * iramaMul;
      const targets = this.targets().filter((f) => {
        const d = dist(p.x, p.cy, f.x, f.cy);
        return d < range + f.radius && Math.abs(angleDiff(p.aim, angleTo(p.x, p.cy, f.x, f.cy))) < arc / 2 + 0.2;
      });
      for (const f of targets) {
        this.damageFoe(f, dmg, onBeat);
        f.push(p.x, p.cy, 260 * this.mods.knockback);
        if (onBeat && this.mods.twinStrike) this.damageFoe(f, dmg * 0.6 * this.mods.twinStrike, onBeat);
      }
    } else if (kind === 'gong') {
      this.gongBlast(onBeat ? 1.5 : 1, onBeat);
      if (this.mods.gongEcho) setTimeout(() => this.state === 'play' && this.gongBlast(0.7, false), 450);
    } else if (kind === 'dash') {
      this.audio.sfx('dash');
      this.effects.burst(p.x, p.y - 20, 'rgba(90,52,22,0.7)', 8, 160, 5);
      if (onBeat) p.dashCd *= 0.5;
    }
  }

  gongBlast(power, onBeat) {
    const p = this.player;
    this.audio.sfx('gongBlast');
    this.effects.ring(p.x, p.cy, PLAYER.gongRadius * power, '#ffd23f', 0.6);
    this.effects.ring(p.x, p.cy, PLAYER.gongRadius * power * 0.7, '#c8322a', 0.5);
    this.effects.kick(10);
    this.effects.callout(onBeat ? 'GONG AGENG!' : 'GONG!', '#ffd23f');
    for (const f of this.targets()) {
      if (dist(p.x, p.cy, f.x, f.cy) < PLAYER.gongRadius * power + f.radius) {
        this.damageFoe(f, PLAYER.gongDamage * power * this.mods.damage, onBeat);
        f.push(p.x, p.cy, 520 * this.mods.knockback);
      }
    }
    this.bolts = this.bolts.filter((b) => dist(b.x, b.y, p.x, p.cy) > PLAYER.gongRadius * power);
  }

  dashSweep(p) {
    for (const f of this.targets()) {
      if (!f.dashHit && dist(p.x, p.cy, f.x, f.cy) < f.radius + 30) {
        f.dashHit = 0.3;
        this.damageFoe(f, this.mods.dashDamage, false);
      }
    }
  }

  targets() {
    return this.boss ? [...this.foes, this.boss] : this.foes;
  }

  updateIrama() {
    let level = 0;
    for (let i = 0; i < IRAMA_STEPS.length; i++) if (this.streak >= IRAMA_STEPS[i]) level = i;
    if (level > this.irama) {
      this.effects.callout(`IRAMA ${IRAMA_NAMES[level]}`, '#7fd36a', `score x${level + 1}`);
      this.audio.sfx('irama');
    }
    this.irama = level;
    this.stats.bestIrama = Math.max(this.stats.bestIrama, level);
  }

  damageFoe(f, amount, onBeat) {
    if (f.dead) return;
    const dealt = f.isBoss ? f.takeHit(amount, onBeat) : amount;
    f.hp -= dealt;
    f.hitFlash = 0.1;
    this.player.gong = Math.min(PLAYER.gongCost, this.player.gong + dealt * 0.55 * this.mods.gongGain);
    this.effects.floatText(f.x + this.rng.range(-14, 14), f.cy - 30, `${Math.round(dealt)}`, onBeat ? '#ffe08a' : '#fff4dc', onBeat ? 26 : 18);
    this.effects.burst(f.x, f.cy, onBeat ? '#ffd23f' : '#f3dfb4', onBeat ? 10 : 5, 200, 4);
    this.audio.sfx('hit');
    if (onBeat && this.mods.lifesteal) this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.mods.lifesteal);
    if (f.hp <= 0) this.killFoe(f, onBeat);
  }

  killFoe(f, onBeat) {
    f.dead = true;
    this.stats.kills += 1;
    this.chain = this.chainTimer > 0 ? this.chain + 1 : 1;
    this.chainTimer = 1.4;
    this.stats.bestChain = Math.max(this.stats.bestChain, this.chain);
    const roadMul = this.road === 'garagara' ? 1.5 : 1;
    const gained = Math.round(f.def.score * (this.irama + 1) * this.diff.scoreMul * roadMul * (1 + (this.chain - 1) * 0.1));
    this.score += gained;
    this.effects.floatText(f.x, f.cy - 56, `+${gained}`, '#ffd23f', 22);
    this.effects.burst(f.x, f.cy, f.def.color || '#ffd23f', f.isBoss ? 80 : 18, f.isBoss ? 420 : 260, f.isBoss ? 8 : 5);
    this.audio.sfx('kill');
    if (this.chain >= 3) this.effects.callout(`CHAIN x${this.chain}!`, '#ff8a3a');
    if (f.isBoss) {
      this.bossDefeated.push(f.kind);
      this.effects.callout(`${f.def.name} FALLS`, '#ffe08a', `+${gained}`);
      this.effects.kick(18);
      this.boss = null;
    }
    if (onBeat && this.mods.sparks) {
      const near = this.foes.filter((o) => !o.dead && o !== f).sort((a, b) => dist(f.x, f.y, a.x, a.y) - dist(f.x, f.y, b.x, b.y)).slice(0, this.mods.sparks);
      for (const o of near) {
        this.effects.ring(o.x, o.cy, 40, '#ffd23f', 0.3);
        this.damageFoe(o, 14, false);
      }
    }
  }

  hurtPlayer(amount, src) {
    const p = this.player;
    if (p.invuln > 0 || this.state !== 'play') return;
    if (p.shieldLeft > 0) {
      p.shieldLeft -= 1;
      p.invuln = 0.5;
      this.effects.callout('KAYON WARD!', '#7fd36a');
      return;
    }
    p.hp -= amount;
    p.invuln = 0.7;
    this.stats.hitsTaken += 1;
    this.nightHits += 1;
    this.streak = Math.floor(this.streak / 2);
    this.updateIrama();
    this.effects.kick(9);
    this.effects.burst(p.x, p.cy, '#ff5a46', 14, 240);
    this.effects.floatText(p.x, p.y - 120, `-${amount}`, '#ff5a46', 24);
    this.audio.sfx('hurt');
    if (src && src.push) p.x += Math.sign(p.x - src.x) * 24;
    if (p.hp <= 0) this.endRun(false, 'The hero puppet fell');
  }

  drainLamp(amount) {
    this.lamp.oil = Math.max(0, this.lamp.oil - amount);
    this.stats.lowestOil = Math.min(this.stats.lowestOil, this.lamp.oil);
    if (!this.lampWarned || this.time - this.lampWarned > 2.5) {
      this.lampWarned = this.time;
      this.effects.floatText(LAMP_X, LAMP_Y - 80, 'THE LAMP DIMS!', '#ff5a46', 20);
      this.audio.sfx('lamp');
    }
    if (this.lamp.oil <= 0) this.endRun(false, 'The blencong lamp went out');
  }

  spawnBolt(x, y, vx, vy, dmg, color, radius) {
    this.bolts.push(new Bolt(x, y, vx, vy, dmg, color, radius));
  }

  spawnFoe(kind, x, y) {
    if (x === undefined) {
      const side = this.rng.int(0, 3);
      if (side === 0) { x = 20; y = this.rng.range(160, 740); }
      else if (side === 1) { x = 1260; y = this.rng.range(160, 740); }
      else if (side === 2) { x = this.rng.range(200, 1080); y = 110; }
      else { x = this.rng.range(200, 1080); y = 770; }
    }
    this.foes.push(new Foe(kind, x, y, this.diff));
  }

  // ---- flow ----
  update(dt, input) {
    this.time += dt;
    this.beatFlash = Math.max(0, this.beatFlash - dt * 3);
    this.clock.update(dt);
    if (this.state !== 'play' || this.paused) return;
    this.stats.time += dt;
    this.chainTimer -= dt;
    this.lamp.oil = Math.min(LAMP.maxOil, this.lamp.oil + this.mods.oilRegen * dt);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.queue.length) {
      this.spawnFoe(this.queue.shift());
      this.spawnTimer = Math.max(0.35, 1.05 - this.nightIndex * 0.08) * (this.boss ? 2.2 : 1);
    }
    if (this.bossPending && this.queue.length <= this.nightTotal * 0.25) {
      this.boss = new Boss(this.bossPending, this.diff);
      this.effects.callout(this.boss.def.name, '#ff5a46', this.boss.def.rule);
      this.audio.sfx('gongBlast');
      this.bossPending = null;
    }

    this.player.update(dt, input, this);
    for (const f of this.foes) {
      f.update(dt, this);
      if (f.dashHit) f.dashHit = Math.max(0, f.dashHit - dt) || undefined;
    }
    if (this.boss) this.boss.update(dt, this);
    for (const b of this.bolts) b.update(dt, this);
    this.foes = this.foes.filter((f) => !f.dead);
    this.bolts = this.bolts.filter((b) => !b.dead);
    this.effects.update(dt);

    if (this.state === 'play' && !this.queue.length && !this.foes.length && !this.boss && !this.bossPending) {
      this.clearNight();
    }
  }

  clearNight() {
    if (this.nightHits === 0) this.stats.cleanNights += 1;
    const bonus = Math.round((1000 + this.lamp.oil * 20) * this.diff.scoreMul * (this.nightIndex + 1));
    this.score += bonus;
    if (this.nightIndex >= NIGHTS.length - 1) {
      this.endRun(true, 'The Moon-Eater is driven off and dawn comes');
      return;
    }
    this.audio.sfx('win');
    this.state = 'draft';
    this.draft = {
      bonus,
      choices: draftChoices(this.rng, this.owned),
      extra: this.road === 'garagara' ? 1 : 0,
      picked: null,
      roadPicked: null,
    };
  }

  pickTembang(i) {
    const d = this.draft;
    if (!d || !d.choices[i]) return;
    const t = d.choices[i];
    t.apply(this.mods);
    this.owned.push(t.id);
    this.audio.sfx('pick');
    if (d.extra > 0) {
      d.extra -= 1;
      d.choices = draftChoices(this.rng, this.owned);
      return;
    }
    d.picked = t.id;
  }

  pickRoad(id) {
    const d = this.draft;
    if (!d || !d.picked) return;
    this.road = id;
    if (id === 'garagara') this.stats.tookGaragara = true;
    if (id === 'limbukan') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
      this.lamp.oil = Math.min(LAMP.maxOil, this.lamp.oil + 30);
    }
    this.audio.sfx('pick');
    this.foes = [];
    this.bolts = [];
    this.state = 'play';
    this.startNight(this.nightIndex + 1);
  }

  gradeFor(victory) {
    const beatRate = this.stats.actions ? this.stats.onBeat / this.stats.actions : 0;
    if (victory && beatRate >= 0.55 && this.stats.lowestOil > 50) return 'S';
    if (victory) return 'A';
    if (this.nightIndex >= 4) return 'B';
    if (this.nightIndex >= 2) return 'C';
    return 'D';
  }

  feats() {
    const s = this.stats;
    const rate = s.actions ? s.onBeat / s.actions : 0;
    return [
      { text: 'Cracked RAKSASA WESI, the Iron Ogre', done: this.bossDefeated.includes('ironOgre') },
      { text: 'Drove off the Moon-Eater', done: this.bossDefeated.includes('moonEater') },
      { text: 'Kept the lamp above half oil', done: s.lowestOil > 50 },
      { text: 'Reached IRAMA RANGKEP (x5)', done: s.bestIrama >= 4 },
      { text: 'Kill chain of 6 or more', done: s.bestChain >= 6 },
      { text: 'Landed 60% of actions ON BEAT', done: rate >= 0.6 },
      { text: 'A whole night without a wound', done: s.cleanNights > 0 },
      { text: 'Walked the Gara-gara road', done: s.tookGaragara },
    ];
  }

  endRun(victory, reason) {
    if (this.state === 'end') return;
    this.state = 'end';
    const grade = this.gradeFor(victory);
    this.result = { victory, reason, grade, score: this.score, night: this.nightIndex + 1, diff: this.diff.name, feats: this.feats() };
    const before = this.save.best;
    recordRun(this.save, this.result);
    this.result.newBest = this.score > before;
    this.audio.sfx(victory ? 'win' : 'lose');
  }

  bossInfo() {
    if (this.boss) return this.boss;
    if (this.bossPending) return { pending: true, def: BOSS_KINDS[this.bossPending] };
    return null;
  }

  ownedTembang() {
    return this.owned.map(tembangById);
  }
}
