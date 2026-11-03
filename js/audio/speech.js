// Spoken instructions via the Web Speech API.
// iOS rules this handles:
//  - Nothing speaks until the first user tap -> call unlock() from a tap handler.
//  - Voices load asynchronously -> re-pick when 'voiceschanged' fires.
//  - speak() right after cancel() can be dropped on Safari -> small delay.
// Display text and spoken text are always separate (screens pass plain words).

const synth = globalThis.speechSynthesis;
const RATE = 0.85;
const PITCH = 1.1;

// Voices that tend to sound friendly on iPad. First match wins.
const PREFERRED = [
  /Ava.*(Premium|Enhanced)/i,
  /Samantha.*(Premium|Enhanced)/i,
  /Zoe.*(Premium|Enhanced)/i,
  /Allison.*(Premium|Enhanced)/i,
  /(Premium|Enhanced)/i,
  /^Samantha/i,
  /^Ava/i,
  /^Karen/i,
  /^Moira/i,
];

let voice = null;
let preferredURI = null;
let lastText = '';
let unlocked = false;
let token = 0;

export function available() {
  return !!synth;
}

export function englishVoices() {
  if (!synth) return [];
  return synth.getVoices().filter((v) => /^en/i.test(v.lang));
}

function pickVoice() {
  const voices = englishVoices();
  if (!voices.length) return;
  if (preferredURI) {
    const chosen = voices.find((v) => v.voiceURI === preferredURI);
    if (chosen) return (voice = chosen);
  }
  const us = voices.filter((v) => /en[-_]US/i.test(v.lang));
  for (const re of PREFERRED) {
    const v = us.find((x) => re.test(x.name)) || voices.find((x) => re.test(x.name));
    if (v) return (voice = v);
  }
  voice = us[0] || voices[0];
}

export function setVoice(uri) {
  preferredURI = uri || null;
  pickVoice();
}

export function currentVoiceName() {
  return voice ? voice.name : 'default';
}

if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

/** Must be called inside a tap handler once, before any speech. */
export function unlock() {
  if (!synth || unlocked) return;
  unlocked = true;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
}

/**
 * Speak text, interrupting anything already being said.
 * Resolves when speech ends (or after a safety timeout, since Safari sometimes never fires onend).
 */
export function speak(text, { remember = true } = {}) {
  if (remember) lastText = text;
  if (!synth || !text) return Promise.resolve();
  const my = ++token;
  synth.cancel();
  return new Promise((resolve) => {
    const words = text.split(/\s+/).length;
    const safety = setTimeout(done, 1500 + words * 600);
    function done() {
      clearTimeout(safety);
      resolve(my === token);
    }
    setTimeout(() => {
      if (my !== token) return done();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || 'en-US';
      u.rate = RATE;
      u.pitch = PITCH;
      u.onend = done;
      u.onerror = done;
      synth.speak(u);
    }, 60);
  });
}

/** Say the last instruction again (the replay button). */
export function replay() {
  return speak(lastText);
}

export function stop() {
  token++;
  synth?.cancel();
}
