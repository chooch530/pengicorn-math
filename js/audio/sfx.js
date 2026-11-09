// Sound effects synthesized with the Web Audio API. No audio files.
// The AudioContext must be created/resumed inside a tap -> call unlock() from a tap handler.

let ctx = null;
let master = null;
let muted = false;

export function unlock() {
  try {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    // iOS needs a sound started inside the gesture to fully unlock.
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(master);
    s.start(0);
  } catch {
    /* audio unavailable; game still works */
  }
}

export function setMuted(m) {
  muted = !!m;
  if (master) master.gain.value = muted ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function tone(freq, start, dur, { type = 'sine', vol = 0.4, slideTo = null } = {}) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let noiseBuf = null;
function noise(start, dur, { type = 'lowpass', freq = 800, endFreq = null, vol = 0.5 } = {}) {
  if (!ctx || muted) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + start;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (endFreq) f.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

export const sfx = {
  tap() {
    tone(660, 0, 0.08, { type: 'triangle', vol: 0.25 });
  },
  correct() {
    // Happy rising arpeggio (C E G C).
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.25, { type: 'triangle', vol: 0.35 }));
  },
  tryAgain() {
    // Soft, low, two-note "hmm-mm". Deliberately not a buzzer.
    tone(392, 0, 0.18, { vol: 0.2 });
    tone(349, 0.16, 0.25, { vol: 0.18 });
  },
  hint() {
    tone(880, 0, 0.12, { vol: 0.15 });
  },
  count(i = 0) {
    tone(500 + i * 40, 0, 0.12, { type: 'triangle', vol: 0.2 });
  },
  splash() {
    tone(900, 0, 0.18, { type: 'sine', vol: 0.2, slideTo: 300 });
  },
  star(i = 0) {
    tone(880 + i * 220, 0, 0.35, { type: 'triangle', vol: 0.3 });
    tone(1320 + i * 220, 0.05, 0.3, { type: 'sine', vol: 0.15 });
  },
  cannon() {
    tone(110, 0, 0.25, { type: 'sine', vol: 0.5, slideTo: 40 });
    noise(0, 0.25, { freq: 1200, endFreq: 200, vol: 0.45 });
  },
  boom() {
    tone(70, 0, 0.6, { type: 'sine', vol: 0.55, slideTo: 30 });
    noise(0, 0.7, { freq: 900, endFreq: 120, vol: 0.6 });
  },
  waterSplash() {
    noise(0, 0.5, { type: 'bandpass', freq: 2200, endFreq: 500, vol: 0.4 });
  },
  sink() {
    tone(320, 0, 2.2, { type: 'triangle', vol: 0.25, slideTo: 55 });
    for (let i = 0; i < 8; i++) tone(500 + Math.random() * 500, 0.3 + i * 0.22, 0.08, { vol: 0.12, slideTo: 900 });
  },
  horn() {
    tone(196, 0, 0.6, { type: 'sawtooth', vol: 0.12 });
    tone(147, 0, 0.6, { type: 'sawtooth', vol: 0.1 });
  },
  // Heroes world.
  whoosh() {
    noise(0, 0.4, { type: 'bandpass', freq: 600, endFreq: 2400, vol: 0.3 });
  },
  pop() {
    tone(1200, 0, 0.08, { type: 'sine', vol: 0.4, slideTo: 300 });
    noise(0, 0.08, { type: 'highpass', freq: 3000, vol: 0.25 });
  },
  sparkle() {
    [1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.06, 0.2, { type: 'triangle', vol: 0.18 }));
  },
  boing() {
    tone(220, 0, 0.35, { type: 'triangle', vol: 0.3, slideTo: 520 });
  },
  fanfare() {
    [523, 659, 784, 659, 784, 1047].forEach((f, i) =>
      tone(f, i * 0.12, i === 5 ? 0.6 : 0.18, { type: 'triangle', vol: 0.35 })
    );
  },
};
