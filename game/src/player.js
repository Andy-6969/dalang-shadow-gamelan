// The hero puppet: WASD to move, mouse to aim, left click to slash with the keris, right click
// for the gong blast, Space to dash (sabet). Landing any of them on the beat is an ON BEAT action.

import { PLAYER, PALETTE } from './config.js';
import { clamp, angleTo } from './rng.js';
import { drawWithShadow, drawSatria } from './puppets.js';

export class Player {
  constructor(maxHp = PLAYER.maxHp) {
    this.x = 520;
    this.y = 560;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.aim = 0;
    this.facing = 1;
    this.slashCd = 0;
    this.dashCd = 0;
    this.dashTime = 0;
    this.dashDir = { x: 1, y: 0 };
    this.invuln = 0;
    this.gong = 0;
    this.swing = 0;
    this.slashFx = null;
    this.beatGlow = 0;
    this.shieldLeft = 0;
    this.t = 0;
  }

  get cy() { return this.y - 60; }

  update(dt, input, game) {
    const m = game.mods;
    this.t += dt;
    this.slashCd -= dt;
    this.dashCd -= dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.beatGlow = Math.max(0, this.beatGlow - dt * 3);
    this.swing *= Math.pow(0.0005, dt);
    if (this.slashFx) { this.slashFx.life -= dt; if (this.slashFx.life <= 0) this.slashFx = null; }

    this.aim = angleTo(this.x, this.cy, input.mouse.x, input.mouse.y);
    this.facing = Math.cos(this.aim) >= 0 ? 1 : -1;

    if (this.dashTime > 0) {
      this.dashTime -= dt;
      const sp = PLAYER.dashDistance / PLAYER.dashTime;
      this.x += this.dashDir.x * sp * dt;
      this.y += this.dashDir.y * sp * dt;
      if (m.dashDamage > 0) game.dashSweep(this);
    } else {
      const mv = input.moveAxis();
      const sp = PLAYER.speed * m.speed;
      this.x += mv.x * sp * dt;
      this.y += mv.y * sp * dt;
      if (input.hit('Space') && this.dashCd <= 0) {
        let dx = mv.x; let dy = mv.y;
        if (!dx && !dy) { dx = Math.cos(this.aim); dy = Math.sin(this.aim); }
        this.dashDir = { x: dx, y: dy };
        this.dashTime = PLAYER.dashTime;
        this.dashCd = PLAYER.dashCooldown * m.dashCooldown;
        this.invuln = PLAYER.dashTime + 0.08;
        game.playerAction('dash');
      }
    }
    this.x = clamp(this.x, 40, 1240);
    this.y = clamp(this.y, 140, 765);

    if ((input.mouse.leftPressed || input.mouse.left) && this.slashCd <= 0) {
      this.slashCd = PLAYER.slashCooldown;
      this.swing = this.swing > 0 ? -1.4 : 1.4;
      this.slashFx = { angle: this.aim, life: 0.16, onBeat: false };
      game.playerAction('slash');
    }
    if (input.mouse.rightPressed || input.hit('KeyF')) {
      if (this.gong >= PLAYER.gongCost) {
        this.gong = 0;
        game.playerAction('gong');
      } else {
        game.effects.floatText(this.x, this.y - 120, 'GONG NOT READY', '#ffb0a0', 16);
      }
    }
  }

  draw(ctx) {
    const blink = this.invuln > 0 && Math.floor(this.t * 30) % 2 === 0;
    if (this.beatGlow > 0) {
      ctx.fillStyle = `rgba(255, 224, 138, ${this.beatGlow * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y - 62, 70, 92, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.shieldLeft > 0) {
      ctx.strokeStyle = 'rgba(127, 211, 106, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 60, 72, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (!blink) {
      const local = this.facing > 0 ? this.aim : Math.PI - this.aim;
      drawWithShadow(ctx, this.x, this.y, 1.25, this.facing, (c, sh) => drawSatria(c, sh, { armAngle: local * 0.8 - 0.2, swing: this.swing * 0.5 }));
    }
    if (this.slashFx) {
      const f = this.slashFx;
      const k = 1 - f.life / 0.16;
      ctx.save();
      ctx.translate(this.x, this.cy);
      ctx.strokeStyle = f.onBeat ? PALETTE.beat : 'rgba(255, 244, 220, 0.85)';
      ctx.lineWidth = f.onBeat ? 14 : 8;
      ctx.globalAlpha = 1 - k * 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, f.range * (0.7 + k * 0.3), f.angle - f.arc / 2, f.angle + f.arc / 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
