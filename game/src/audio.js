// Gamelan synthesiser: saron, bonang, kempul, gong and kendang made from oscillators and noise,
// played on the beat clock so the music and the combat share one pulse. No audio files.

const SLENDRO = [1, 1.149, 1.32, 1.516, 1.741, 2, 2.298, 2.64];
const BALUNGAN = [
  [2, 1, 2, 3, 5, 3, 2, 1, 3, 2, 1, 0, 2, 3, 2, 0],
  [5, 3, 5, 6, 5, 3, 2, 3, 5, 6, 7, 6, 5, 3, 2, 0],
];

export class GamelanAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.base = 262;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp);
    comp.connect(this.ctx.destination);
    this.noiseBuffer = this.makeNoise();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
    return this.muted;
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 0.5;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // A struck metal bar: a fundamental plus inharmonic partials, each decaying on its own.
  metal(freq, { gain = 0.2, decay = 1.2, partials = [1, 2.76, 5.4], beat = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    partials.forEach((p, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * p + (i === 0 ? beat : 0);
      const level = gain / (1 + i * 1.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(level, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay / (1 + i * 0.9));
      osc.connect(g).connect(this.master);
      osc.start(t);
      osc.stop(t + decay + 0.05);
    });
  }

  saron(step, octave = 1) {
    const f = this.base * SLENDRO[step % SLENDRO.length] * octave;
    this.metal(f, { gain: 0.16, decay: 0.9 });
  }

  bonang(step) {
    const f = this.base * 2 * SLENDRO[step % SLENDRO.length];
    this.metal(f, { gain: 0.08, decay: 0.45, partials: [1, 3.1] });
  }

  kempul() {
    this.metal(this.base / 2 * SLENDRO[4], { gain: 0.22, decay: 1.8, partials: [1, 2.1], beat: 3 });
  }

  gong() {
    this.metal(this.base / 4, { gain: 0.42, decay: 4, partials: [1, 1.48, 2.02], beat: 2.5 });
  }

  kendang(high = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(high ? 240 : 120, t);
    osc.frequency.exponentialRampToValueAtTime(high ? 160 : 60, t + 0.12);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  noiseHit(gain = 0.2, decay = 0.12, freq = 1800) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + decay + 0.02);
  }

  // Music: one call per beat of the clock.
  playBeat(beatIndex, nightIndex, intensity) {
    if (!this.ctx) return;
    const line = BALUNGAN[nightIndex >= 4 ? 1 : 0];
    this.saron(line[beatIndex % line.length]);
    if (intensity > 1) this.bonang(line[(beatIndex + 2) % line.length] + 2);
    if (beatIndex % 2 === 1) this.kendang(beatIndex % 4 === 3);
    if (beatIndex % 8 === 4) this.kempul();
    if (beatIndex % 16 === 0) this.gong();
  }

  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'slash': this.noiseHit(0.16, 0.09, 2600); break;
      case 'beatSlash': this.noiseHit(0.2, 0.1, 3200); this.bonang(5); break;
      case 'hit': this.noiseHit(0.22, 0.08, 900); break;
      case 'kill': this.metal(this.base * 3, { gain: 0.1, decay: 0.35, partials: [1, 2.4] }); break;
      case 'dash': this.noiseHit(0.12, 0.2, 600); break;
      case 'gongBlast': this.gong(); this.kendang(false); break;
      case 'hurt': this.kendang(false); this.noiseHit(0.25, 0.15, 400); break;
      case 'lamp': this.metal(this.base * 0.75, { gain: 0.12, decay: 0.6, partials: [1, 1.5] }); break;
      case 'pick': this.saron(0, 2); this.saron(2, 2); break;
      case 'win': [0, 2, 4, 5].forEach((s, i) => setTimeout(() => this.saron(s, 2), i * 140)); this.gong(); break;
      case 'lose': this.gong(); this.kempul(); break;
      case 'irama': this.bonang(7); this.bonang(4); break;
      default: break;
    }
  }
}
