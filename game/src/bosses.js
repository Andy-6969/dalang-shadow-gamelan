// The two bosses of the lakon. Each has phases, attacks timed to the gamelan beat, and a rule
// the player has to learn: the Iron Ogre's plates only crack ON BEAT; the Moon-Eater dims the lamp.

import { LAMP_X, LAMP_Y } from './config.js';
import { dist, angleTo, clamp } from './rng.js';
import { drawWithShadow, drawIronOgre, drawMoonEater } from './puppets.js';

export const BOSS_KINDS = {
  ironOgre: {
    name: 'RAKSASA WESI',
    title: 'the Iron Ogre',
    short: 'the Ogre',
    hp: 640,
    radius: 60,
    scale: 2.1,
    score: 5000,
    rule: 'Iron plates: only ON BEAT strikes crack them',
    phases: ['IRON HIDE', 'CRACKED', 'BERSERK'],
  },
  moonEater: {
    name: 'SANG PEMANGSA BULAN',
    title: 'the Moon-Eater',
    short: 'the Eater',
    hp: 1100,
    radius: 70,
    scale: 1.7,
    score: 12000,
    rule: 'It swallows the light: keep the lamp burning',
    phases: ['RISING', 'ECLIPSE', 'DEVOURING'],
  },
};

export class Boss {
  constructor(kind, diff) {
    const def = BOSS_KINDS[kind];
    this.kind = kind;
    this.isBoss = true;
    this.def = def;
    this.hp = def.hp * diff.enemyHp;
    this.maxHp = this.hp;
    this.radius = def.radius;
    this.x = kind === 'moonEater' ? LAMP_X : 1100;
    this.y = kind === 'moonEater' ? 300 : 560;
    this.facing = -1;
    this.t = 0;
    this.hitFlash = 0;
    this.dead = false;
    this.charge = null;
    this.attackCd = 2;
    this.plates = 4;
    this.darkness = 0;
  }

  get cy() { return this.kind === 'moonEater' ? this.y - 60 : this.y - 90; }

  get phase() {
    const r = this.hp / this.maxHp;
    return r > 0.66 ? 0 : r > 0.33 ? 1 : 2;
  }

  // Damage rule: the Iron Ogre shrugs off off-beat blows while it has plates.
  takeHit(amount, onBeat) {
    if (this.kind === 'ironOgre' && this.plates > 0 && !onBeat) return amount * 0.25;
    if (this.kind === 'ironOgre' && onBeat && this.plates > 0) {
      const before = Math.ceil((this.hp / this.maxHp) * 4);
      const after = Math.ceil(((this.hp - amount) / this.maxHp) * 4);
      if (after < before) this.plates = Math.max(0, this.plates - 1);
    }
    return amount;
  }

  update(dt, game) {
    this.t += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attackCd -= dt;
    const p = game.player;
    if (this.kind === 'ironOgre') {
      if (this.charge) {
        this.x += this.charge.vx * dt;
        this.y += this.charge.vy * dt;
        this.charge.time -= dt;
        if (this.charge.time <= 0) this.charge = null;
      } else {
        const a = angleTo(this.x, this.y, p.x, p.y);
        const sp = 40 + this.phase * 25;
        this.x += Math.cos(a) * sp * dt;
        this.y += Math.sin(a) * sp * dt;
      }
      this.facing = p.x > this.x ? 1 : -1;
      if (dist(this.x, this.y, p.x, p.y) < this.radius + 26) game.hurtPlayer(16, this);
      if (dist(this.x, this.y, LAMP_X, LAMP_Y) < this.radius + 40) game.drainLamp(14 * dt, this);
    } else {
      const sway = Math.sin(this.t * 0.6) * 340;
      this.x += (LAMP_X + sway - this.x) * dt * 0.9;
      this.y += (250 + Math.sin(this.t * 1.3) * 40 - this.y) * dt;
      this.darkness = clamp(0.2 + this.phase * 0.3, 0, 0.85);
      if (this.phase >= 1) game.drainLamp(1.2 * dt, this);
    }
    this.x = clamp(this.x, 80, 1200);
    this.y = clamp(this.y, 160, 740);
  }

  onBeat(game, beatIndex) {
    const p = game.player;
    if (this.kind === 'ironOgre') {
      if (beatIndex % 8 === 0) {
        const a = angleTo(this.x, this.y, p.x, p.y);
        const sp = 420 + this.phase * 80;
        this.charge = { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, time: 0.6 };
        game.effects.callout('CHARGE!', '#ff5a46');
      }
      if (beatIndex % 8 === 4 && this.phase >= 1) {
        game.effects.ring(this.x, this.y - 20, 300, '#aab7c4', 0.7);
        game.effects.kick(8);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          game.spawnBolt(this.x, this.y - 30, Math.cos(a) * 230, Math.sin(a) * 230, 12, '#aab7c4', 10);
        }
      }
    } else {
      const count = 5 + this.phase * 2;
      if (beatIndex % 4 === 0) {
        const base = angleTo(this.x, this.cy, p.x, p.y - 40);
        for (let i = 0; i < count; i++) {
          const a = base + (i - (count - 1) / 2) * 0.18;
          game.spawnBolt(this.x, this.cy + 20, Math.cos(a) * 250, Math.sin(a) * 250, 12, '#c7b8ff', 9);
        }
      }
      if (beatIndex % 16 === 8 && this.phase >= 1) game.spawnFoe('lelawa', this.x + 60, this.y);
      if (beatIndex % 16 === 12 && this.phase >= 2) game.spawnFoe('wewe', this.x - 60, this.y);
    }
  }

  push() { /* bosses are not pushed */ }

  draw(ctx) {
    if (this.hitFlash > 0) ctx.filter = 'brightness(1.9)';
    if (this.kind === 'ironOgre') {
      drawWithShadow(ctx, this.x, this.y, this.def.scale, this.facing, (c, sh) => drawIronOgre(c, sh, this.t, this.plates));
    } else {
      drawWithShadow(ctx, this.x, this.y, this.def.scale, 1, (c, sh) => drawMoonEater(c, sh, this.t, this.phase / 2));
    }
    ctx.filter = 'none';
  }
}
