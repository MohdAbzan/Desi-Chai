// Procedural lo-fi ambient engine (no external audio assets).
// Soft jazzy chord pads + bass + subtle vinyl crackle, looped.

class LofiEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.lp = null;
    this.vol = 0.35;
    this.playing = false;
    this.step = 0;
    this.timer = null;
    this.crackle = null;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.vol;
    this.lp = this.ctx.createBiquadFilter();
    this.lp.type = "lowpass";
    this.lp.frequency.value = 1900;
    this.master.connect(this.lp).connect(this.ctx.destination);
  }

  startCrackle() {
    const c = this.ctx;
    const dur = 2;
    const frames = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, frames, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.5;
      if (Math.random() < 0.0008) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2200;
    const g = c.createGain();
    g.gain.value = 0.025;
    src.connect(hp).connect(g).connect(this.master);
    src.start();
    this.crackle = src;
  }

  playChord(freqs, at, dur) {
    const c = this.ctx;
    freqs.forEach((f, idx) => {
      const osc = c.createOscillator();
      osc.type = idx === 0 ? "triangle" : "sine";
      osc.frequency.value = f;
      osc.detune.value = Math.random() * 8 - 4;
      const g = c.createGain();
      const peak = 0.11 / (idx + 1);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(peak, at + 0.8);
      g.gain.setValueAtTime(peak, at + dur - 1);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(g).connect(this.master);
      osc.start(at);
      osc.stop(at + dur + 0.1);
    });
    // bass root, one octave down
    const b = c.createOscillator();
    b.type = "sine";
    b.frequency.value = freqs[0] / 2;
    const bg = c.createGain();
    bg.gain.setValueAtTime(0.0001, at);
    bg.gain.linearRampToValueAtTime(0.16, at + 0.4);
    bg.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    b.connect(bg).connect(this.master);
    b.start(at);
    b.stop(at + dur + 0.1);
  }

  loop() {
    if (!this.playing) return;
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 261.63, 329.63, 440.0], // Fmaj7
      [196.0, 246.94, 349.23, 440.0], // G7
    ];
    const dur = 3.6;
    const at = this.ctx.currentTime + 0.05;
    this.playChord(chords[this.step % chords.length], at, dur);
    this.step++;
    this.timer = setTimeout(() => this.loop(), dur * 1000);
  }

  start() {
    this.ensure();
    if (this.ctx.state === "suspended") this.ctx.resume();
    if (this.playing) return;
    this.playing = true;
    if (!this.crackle) this.startCrackle();
    this.loop();
  }

  stop() {
    this.playing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  setVolume(v) {
    this.vol = v;
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }
}

let engine = null;
export function getLofi() {
  if (!engine) engine = new LofiEngine();
  return engine;
}
