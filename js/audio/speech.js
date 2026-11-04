// Spoken instructions via the Web Speech API.
// iOS rules this handles:
//  - Nothing speaks until the first user tap -> call unlock() from a tap handler.
//  - Voices load asynchronously -> re-pick when 'voiceschanged' fires.
//  - speak() right after cancel() can be dropped on Safari -> small delay.
// Display text and spoken text are always separate (screens pass plain words).

const synth = globalThis.speechSynthesis;
// Natural settings: raising the pitch made voices sound more synthetic.
const RATE = 0.9;
const PITCH = 1.0;

// Apple's joke/novelty voices (robotic on purpose). Never auto-picked.
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Fred|Good News|Hysterical|Jester|Junior|Kathy|Organ|Pipe Organ|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley)\b/i;
// Friendly-sounding names, best first (used to break ties within a quality tier).
const NICE = ['Ava', 'Zoe', 'Samantha', 'Evan', 'Nathan', 'Allison', 'Susan', 'Tom', 'Joelle', 'Noelle', 'Karen', 'Moira'];

/** Higher is better: Premium > Enhanced > standard; novelty voices last. */
export function voiceQuality(v) {
  if (NOVELTY.test(v.name)) return -1;
  if (/premium/i.test(v.name) || /premium/i.test(v.voiceURI)) return 3;
  if (/enhanced/i.test(v.name) || /enhanced/i.test(v.voiceURI)) return 2;
  return 1;
}

export function qualityLabel(v) {
  return ['Novelty', '', 'Standard', 'Enhanced', 'Premium'][voiceQuality(v) + 1];
}

let voice = null;
let preferredURI = null;
let lastText = '';
let unlocked = false;
let token = 0;

export function available() {
  return !!synth;
}

function score(v) {
  const nice = NICE.findIndex((n) => v.name.startsWith(n));
  return voiceQuality(v) * 100 + (/en[-_]US/i.test(v.lang) ? 20 : 0) + (nice >= 0 ? 15 - nice : 0);
}

/** English voices, best first. */
export function englishVoices() {
  if (!synth) return [];
  return synth
    .getVoices()
    .filter((v) => /^en/i.test(v.lang))
    .sort((a, b) => score(b) - score(a));
}

function pickVoice() {
  const voices = englishVoices();
  if (!voices.length) return;
  const chosen = preferredURI && voices.find((v) => v.voiceURI === preferredURI);
  const best = voices[0];
  // Use the parent's choice, unless a better-quality voice was downloaded after they chose.
  voice = chosen && voiceQuality(best) <= preferredBestAtPick ? chosen : best;
}

export function bestVoiceQuality() {
  const v = englishVoices()[0];
  return v ? voiceQuality(v) : 0;
}

let preferredBestAtPick = 0;

/** uri = parent's choice; bestAtPick = best quality that existed when they chose it. */
export function setVoice(uri, bestAtPick = 3) {
  preferredURI = uri || null;
  preferredBestAtPick = bestAtPick;
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
