// Spoken text for problems. Kept apart from display text: TTS reads "3+2" or "−"
// inconsistently, so we always speak plain words.

const NOUNS = {
  fish: { one: 'fish', many: 'fish', verb: 'catches', base: 'catch' },
  snowball: { one: 'snowball', many: 'snowballs', verb: 'makes', base: 'make' },
};

const n = (count, kind) => `${count} ${count === 1 ? NOUNS[kind].one : NOUNS[kind].many}`;

export function questionText(p, hero = 'Pip') {
  const w = NOUNS[p.objectKind] || NOUNS.fish;
  const kind = NOUNS[p.objectKind] ? p.objectKind : 'fish';
  let story;
  if (p.a === 0) story = `${hero} has no ${w.many}. ${hero} ${w.verb} ${n(p.b, kind)}.`;
  else if (p.b === 0) story = `${hero} has ${n(p.a, kind)}. ${hero} does not ${w.base} any more.`;
  else story = `${hero} has ${n(p.a, kind)}. ${hero} ${w.verb} ${p.b} more.`;
  return `${story} How many ${w.many} now?`;
}

/** Short question for numbers-only mode (no story about fish the kid can't see). */
export function numberQuestionText(p) {
  return `What is ${p.a} plus ${p.b}?`;
}

export function equationText(p) {
  return `${p.a} plus ${p.b} is ${p.answer}.`;
}

export function hintText(p) {
  const w = NOUNS[p.objectKind] || NOUNS.fish;
  return `Let's count the ${w.many} together. Try again!`;
}

export function countingText(total) {
  if (total === 0) return 'Zero. There are none!';
  return Array.from({ length: total }, (_, i) => i + 1).join(', ') + '.';
}

const PRAISE = ['Yes!', 'Great job!', 'You got it!', 'Super!', 'Hooray!', 'Awesome!'];

export function praiseText(p, rng) {
  return `${rng.pick(PRAISE)} ${equationText(p)}`;
}

// ---- Sight words (spoken lines) ----

export function findWordText(w) {
  return `Find the word: ${w}.`;
}

export function wordHintText(w) {
  return `Listen again. ${w}. Try again!`;
}

export function wordRevealText(w) {
  return `This word says ${w}.`;
}

const WORD_PRAISE = ['Yes!', 'Great reading!', 'You got it!', 'Super!', 'Nice!', 'Awesome!'];

export function wordPraiseText(w, rng) {
  return `${rng.pick(WORD_PRAISE)} That says ${w}.`;
}
