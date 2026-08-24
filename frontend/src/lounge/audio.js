// Lightweight Web Audio SFX synthesizer (no external assets).
let ctx = null;
let enabled = true;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

export function setAudioEnabled(v) {
  enabled = v;
}
export function isAudioEnabled() {
  return enabled;
}

function tone({ freq = 440, type = "sine", dur = 0.2, gain = 0.15, freqEnd = null, delay = 0 }) {
  const c = ac();
  if (!c || !enabled) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.4, gain = 0.12, delay = 0, lp = 2000, lpEnd = 400 }) {
  const c = ac();
  if (!c || !enabled) return;
  const t0 = c.currentTime + delay;
  const frames = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.setValueAtTime(lp, t0);
  filt.frequency.exponentialRampToValueAtTime(lpEnd, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur);
}

export const SFX = {
  slurp() {
    // sipping / slurp: rising filtered tone + gulp
    tone({ freq: 220, freqEnd: 520, type: "sawtooth", dur: 0.32, gain: 0.06 });
    tone({ freq: 140, freqEnd: 90, type: "sine", dur: 0.18, gain: 0.12, delay: 0.28 });
  },
  cheers() {
    // glass clink: two bright dings
    tone({ freq: 1760, type: "triangle", dur: 0.18, gain: 0.12 });
    tone({ freq: 2400, type: "triangle", dur: 0.16, gain: 0.09, delay: 0.06 });
  },
  steam() {
    noise({ dur: 0.6, gain: 0.1, lp: 4000, lpEnd: 800 });
  },
  wave() {
    tone({ freq: 660, freqEnd: 990, type: "sine", dur: 0.14, gain: 0.1 });
  },
  message() {
    tone({ freq: 880, freqEnd: 1200, type: "sine", dur: 0.1, gain: 0.07 });
  },
  join() {
    tone({ freq: 523, type: "sine", dur: 0.14, gain: 0.09 });
    tone({ freq: 784, type: "sine", dur: 0.16, gain: 0.09, delay: 0.1 });
  },
};

export function playAction(action) {
  if (action === "drink") SFX.slurp();
  else if (action === "cheers") SFX.cheers();
  else if (action === "steam") SFX.steam();
  else if (action === "wave") SFX.wave();
}
