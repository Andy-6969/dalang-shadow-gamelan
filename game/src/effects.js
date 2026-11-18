// Feedback on every action: sparks, leather flakes, floating numbers, big callouts, screen shake.

export class Effects {
  constructor(rng) {
    this.rng = rng;
    this.particles = [];
    this.texts = [];
    this.callouts = [];
    this.rings = [];
    this.shake = 0;
  }

  burst(x, y, color, count = 12, speed = 220, size = 4) {
    for (let i = 0; i < count; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(speed * 0.3, speed);
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: this.rng.range(0.35, 0.8), max: 0.8, color, size: this.rng.range(size * 0.5, size) });
    }
  }

  ring(x, y, radius, color, life = 0.45) {
    this.rings.push({ x, y, radius, color, life, max: life });
  }

  floatText(x, y, text, color = '#fff4dc', size = 22) {
    this.texts.push({ x, y, text, color, size, life: 0.9, max: 0.9 });
  }

  callout(text, color = '#ffe08a', sub = '') {
    this.callouts = this.callouts.filter((c) => c.text !== text);
    this.callouts.push({ text, sub, color, life: 1.3, max: 1.3 });
    if (this.callouts.length > 2) this.callouts.shift();
  }

  kick(amount) {
    this.shake = Math.min(18, this.shake + amount);
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy = p.vy * 0.92 + 120 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const t of this.texts) { t.y -= 46 * dt; t.life -= dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const c of this.callouts) c.life -= dt;
    this.callouts = this.callouts.filter((c) => c.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter((r) => r.life > 0);
    this.shake = Math.max(0, this.shake - dt * 40);
  }

  drawWorld(ctx) {
    for (const r of this.rings) {
      const k = 1 - r.life / r.max;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = 1 - k;
      ctx.lineWidth = 6 * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * (0.3 + k * 0.7), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, p.life / 0.3);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life / 0.3);
      ctx.font = `800 ${t.size}px Georgia, 'Times New Roman', serif`;
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#1a0d08';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  drawCallouts(ctx, cx, cy) {
    ctx.textAlign = 'center';
    this.callouts.forEach((c, i) => {
      const k = 1 - c.life / c.max;
      const pop = k < 0.12 ? 0.6 + k / 0.12 * 0.5 : 1.1 - Math.min(0.1, k * 0.2);
      ctx.save();
      ctx.translate(cx, cy + i * 74);
      ctx.scale(pop, pop);
      ctx.globalAlpha = Math.min(1, c.life / 0.35);
      ctx.font = "900 62px Georgia, 'Times New Roman', serif";
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#1a0d08';
      ctx.strokeText(c.text, 0, 0);
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, 0, 0);
      if (c.sub) {
        ctx.font = "700 22px Georgia, serif";
        ctx.lineWidth = 6;
        ctx.strokeText(c.sub, 0, 30);
        ctx.fillStyle = '#fff4dc';
        ctx.fillText(c.sub, 0, 30);
      }
      ctx.restore();
    });
  }
}
