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
  fanfare() {
    [523, 659, 784, 659, 784, 1047].forEach((f, i) =>
      tone(f, i * 0.12, i === 5 ? 0.6 : 0.18, { type: 'triangle', vol: 0.35 })
    );
  },
};
