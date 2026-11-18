// The foes of the night. Each kind has its own way of moving and attacking: ogres march on the
// lamp, bats swoop the hero, fire skulls shoot on the beat, wewe spirits blink, gendruwo shove.

import { LAMP_X, LAMP_Y, LAMP } from './config.js';
import { dist, angleTo, clamp } from './rng.js';
import { drawWithShadow, drawButo, drawLelawa, drawBanaspati, drawWewe, drawGendruwo } from './puppets.js';

export const FOE_KINDS = {
  buto: { name: 'Buto Cilik', hp: 22, speed: 74, radius: 26, scale: 0.85, damage: 10, score: 100, color: '#3f8a3a', targetsLamp: true, behaviour: 'marches on the lamp, drinks its oil' },
  lelawa: { name: 'Lelawa', hp: 10, speed: 160, radius: 22, scale: 1.05, damage: 8, score: 80, color: '#4a2a5e', targetsLamp: false, behaviour: 'fast bat, zig-zags at the hero' },
  banaspati: { name: 'Banaspati', hp: 18, speed: 90, radius: 24, scale: 1.2, damage: 12, score: 150, color: '#ff8a1e', targetsLamp: false, behaviour: 'fire skull, spits bolts on the beat' },
  wewe: { name: 'Wewe Shade', hp: 30, speed: 70, radius: 24, scale: 0.95, damage: 14, score: 180, color: '#9fd3c9', targetsLamp: true, behaviour: 'ghost, blinks toward the lamp' },
  gendruwo: { name: 'Gendruwo', hp: 95, speed: 52, radius: 40, scale: 1.3, damage: 20, score: 400, color: '#5a3a2a', targetsLamp: true, behaviour: 'armoured brute, hard to push' },
};

export class Foe {
  constructor(kind, x, y, diff) {
    const def = FOE_KINDS[kind];
    this.kind = kind;
    this.def = def;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = def.hp * diff.enemyHp;
    this.maxHp = this.hp;
    this.speed = def.speed * diff.enemySpeed;
    this.radius = def.radius;
    this.facing = 1;
    this.t = Math.random() * 10;
    this.hitFlash = 0;
    this.attackCd = 1;
    this.dead = false;
    this.alpha = 1;
    this.blinkCd = 3;
  }

  // Centre of the body, used for hits (x, y is where the puppet's feet meet the trunk).
  get cy() { return this.y - 40 * this.def.scale; }

  update(dt, game) {
    this.t += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attackCd -= dt;
    const p = game.player;
    const toLamp = dist(this.x, this.y, LAMP_X, LAMP_Y);
    const toPlayer = dist(this.x, this.y, p.x, p.y);
    let tx = p.x; let ty = p.y;
    if (this.def.targetsLamp && toPlayer > 170) { tx = LAMP_X; ty = LAMP_Y; }

    if (this.kind === 'lelawa') {
      const a = angleTo(this.x, this.y, tx, ty) + Math.sin(this.t * 4) * 0.9;
      this.vx = Math.cos(a) * this.speed;
      this.vy = Math.sin(a) * this.speed;
    } else if (this.kind === 'banaspati') {
      const a = angleTo(this.x, this.y, p.x, p.y);
      const want = toPlayer > 300 ? 1 : toPlayer < 220 ? -1 : 0;
      this.vx = Math.cos(a) * this.speed * want + Math.cos(a + Math.PI / 2) * 40;
      this.vy = Math.sin(a) * this.speed * want + Math.sin(a + Math.PI / 2) * 40;
    } else {
      const a = angleTo(this.x, this.y, tx, ty);
      this.vx = Math.cos(a) * this.speed;
      this.vy = Math.sin(a) * this.speed;
    }
    if (this.kind === 'wewe') {
      this.blinkCd -= dt;
      this.alpha = 0.55 + Math.sin(this.t * 3) * 0.3;
      if (this.blinkCd <= 0) {
        this.blinkCd = 3.5;
        const a = angleTo(LAMP_X, LAMP_Y, this.x, this.y) + (Math.random() - 0.5);
        const r = clamp(toLamp * 0.6, 120, 500);
        game.effects.burst(this.x, this.cy, '#9fd3c9', 10, 160);
        this.x = LAMP_X + Math.cos(a) * r;
        this.y = LAMP_Y + Math.sin(a) * r;
      }
    }

    this.x += (this.vx + this.knockX()) * dt;
    this.y += (this.vy + this.knockY()) * dt;
    this.kx = (this.kx || 0) * Math.pow(0.02, dt);
    this.ky = (this.ky || 0) * Math.pow(0.02, dt);
    this.x = clamp(this.x, 30, 1250);
    this.y = clamp(this.y, 80, 770);
    if (Math.abs(this.vx) > 4) this.facing = this.vx > 0 ? 1 : -1;

    // Attacks: touch the lamp to drink its oil, touch the hero to wound.
    if (this.def.targetsLamp && toLamp < LAMP.radius + this.radius) {
      game.drainLamp(this.def.damage * 0.9 * dt, this);
    }
    if (toPlayer < this.radius + 22 && this.attackCd <= 0) {
      this.attackCd = 1.1;
      game.hurtPlayer(this.def.damage, this);
    }
  }

  knockX() { return this.kx || 0; }
  knockY() { return this.ky || 0; }

  push(ax, ay, power) {
    const resist = this.kind === 'gendruwo' ? 0.35 : 1;
    this.kx = (this.kx || 0) + Math.cos(angleTo(ax, ay, this.x, this.y)) * power * resist;
    this.ky = (this.ky || 0) + Math.sin(angleTo(ax, ay, this.x, this.y)) * power * resist;
  }

  // Banaspati spits fire on the beat.
  onBeat(game, beatIndex) {
    if (this.kind === 'banaspati' && beatIndex % 3 === 0) {
      const a = angleTo(this.x, this.cy, game.player.x, game.player.y - 40);
      game.spawnBolt(this.x, this.cy, Math.cos(a) * 260, Math.sin(a) * 260, this.def.damage);
    }
  }

  draw(ctx) {
    const s = this.def.scale;
    const flash = this.hitFlash > 0;
    if (flash) ctx.filter = 'brightness(2.2)';
    switch (this.kind) {
      case 'buto': drawWithShadow(ctx, this.x, this.y, s, this.facing, (c, sh) => drawButo(c, sh, { bob: Math.sin(this.t * 8) * 2, arm: 0.3 + Math.sin(this.t * 6) * 0.3 })); break;
      case 'lelawa': drawWithShadow(ctx, this.x, this.y, s, this.facing, (c, sh) => drawLelawa(c, sh, this.t * 14)); break;
      case 'banaspati': drawWithShadow(ctx, this.x, this.y, s, 1, (c, sh) => drawBanaspati(c, sh, this.t)); break;
      case 'wewe': drawWithShadow(ctx, this.x, this.y, s, this.facing, (c, sh) => drawWewe(c, sh, this.t, this.alpha)); break;
      case 'gendruwo': drawWithShadow(ctx, this.x, this.y, s, this.facing, (c, sh) => drawGendruwo(c, sh, this.t)); break;
      default: break;
    }
    if (flash) ctx.filter = 'none';
    if (this.hp < this.maxHp) {
      const w = 34 * Math.max(0.8, s);
      ctx.fillStyle = 'rgba(26,13,8,0.8)';
      ctx.fillRect(this.x - w / 2, this.y + 8, w, 5);
      ctx.fillStyle = '#ff5a46';
      ctx.fillRect(this.x - w / 2, this.y + 8, w * (this.hp / this.maxHp), 5);
    }
  }
}

// Fire bolts from Banaspati and the bosses.
export class Bolt {
  constructor(x, y, vx, vy, damage, color = '#ff8a1e', radius = 9) {
    Object.assign(this, { x, y, vx, vy, damage, color, radius, life: 4, dead: false });
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0 || this.x < -40 || this.x > 1320 || this.y < -40 || this.y > 840) this.dead = true;
    const p = game.player;
    if (!this.dead && dist(this.x, this.y, p.x, p.y - 40) < this.radius + 18) {
      this.dead = true;
      game.hurtPlayer(this.damage, this);
    }
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(255, 120, 30, 0.35)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff4c0';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}
