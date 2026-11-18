// The beat clock: the gamelan's pulse. Actions landed close to a beat count as ON BEAT.

export class BeatClock {
  constructor(bpm = 90) {
    this.setBpm(bpm);
    this.time = 0;
    this.beatIndex = 0;
    this.listeners = [];
  }

  setBpm(bpm) {
    this.bpm = bpm;
    this.period = 60 / bpm;
  }

  onBeat(fn) { this.listeners.push(fn); }

  update(dt) {
    this.time += dt;
    while (this.time >= this.period) {
      this.time -= this.period;
      this.beatIndex += 1;
      for (const fn of this.listeners) fn(this.beatIndex);
    }
  }

  // Seconds from the nearest beat (0 on the beat).
  offset() {
    return Math.min(this.time, this.period - this.time);
  }

  isOnBeat(window) {
    return this.offset() <= window;
  }

  // 0..1 through the current beat, for pulsing rings and the beat lane.
  phase() {
    return this.time / this.period;
  }
}
