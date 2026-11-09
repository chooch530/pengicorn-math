// Spoken text for problems. Kept apart from display text: TTS reads "3+2" or "−"
// inconsistently, so we always speak plain words.

const NOUNS = {
  fish: { one: 'fish', many: 'fish', verb: 'catches', base: 'catch', away: 'swim away' },
  snowball: { one: 'snowball', many: 'snowballs', verb: 'makes', base: 'make', away: 'melt' },
  star: { one: 'star', many: 'stars', verb: 'finds', base: 'find', away: 'fly away' },
  heart: { one: 'heart', many: 'hearts', verb: 'finds', base: 'find', away: 'float away' },
};

const MINUS = '-';

const n = (count, kind) => `${count} ${count === 1 ? NOUNS[kind].one : NOUNS[kind].many}`;

export function questionText(p, hero = 'Pip') {
  const w = NOUNS[p.objectKind] || NOUNS.fish;
  const kind = NOUNS[p.objectKind] ? p.objectKind : 'fish';
  let story;
  if (p.op === MINUS) {
    if (p.b === 0) story = `${hero} has ${n(p.a, kind)}. None ${w.away}.`;
    else story = `${hero} has ${n(p.a, kind)}. ${p.b} ${w.away}.`;
    return `${story} How many ${w.many} are left?`;
  }
  if (p.a === 0) story = `${hero} has no ${w.many}. ${hero} ${w.verb} ${n(p.b, kind)}.`;
  else if (p.b === 0) story = `${hero} has ${n(p.a, kind)}. ${hero} does not ${w.base} any more.`;
  else story = `${hero} has ${n(p.a, kind)}. ${hero} ${w.verb} ${p.b} more.`;
  return `${story} How many ${w.many} now?`;
}

/** Short question for numbers-only mode (no story about fish the kid can't see). */
export function numberQuestionText(p) {
  return `What is ${p.a} ${opWord(p)} ${p.b}?`;
}

export function equationText(p) {
  return `${p.a} ${opWord(p)} ${p.b} is ${p.answer}.`;
}

function opWord(p) {
  return p.op === MINUS ? 'minus' : 'plus';
}

export function hintText(p) {
  const w = NOUNS[p.objectKind] || NOUNS.fish;
  if (p.op === MINUS) return `Let's take away ${p.b} and count the ${w.many} that are left. Try again!`;
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

// ---- Battleship (spoken lines) ----

export function battleIntroText() {
  return 'Answer the math to fire your cannon! Hit all ten parts to sink the ship!';
}

const HIT = ['Boom! Direct hit!', 'Kaboom! Got it!', 'Bullseye!', 'Boom! Nice shot!', 'Ka-pow! Hit!'];

export function battleHitText(p, rng) {
  return `${rng.pick(HIT)} ${equationText(p)}`;
}

export function battleMissText() {
  return 'Splash! That one missed. Next shot!';
}

export function battleSunkText() {
  return 'You sank the ship! Hooray!';
}

export function battleEscapeText(hits) {
  return `So close! You hit it ${hits} times, and it got away. Let's sink it next time!`;
}

// ---- Pirate ship (Words battleship) ----

export function pirateIntroText() {
  return 'Ahoy! Find the right word to fire your cannon. Hit all ten parts to sink the pirate ship!';
}

export function pirateHitText(w, rng) {
  return `${rng.pick(HIT)} That says ${w}.`;
}

export function pirateSunkText() {
  return 'You sank the pirate ship! Hooray!';
}

export function pirateEscapeText(hits) {
  return `So close! You hit it ${hits} times, and the pirates sailed away. Let's sink them next time!`;
}

// ---- Heroes world: rescue missions (math and words) ----

export function rescueIntroText(team, words = false) {
  const start = team === 'unicorn' ? 'Unicorn power!' : 'Super hero time!';
  const task = words ? 'Find the right word' : 'Answer the math';
  return `${start} ${task} to pop a bubble and save a friend. Save all ten!`;
}

const SAVE = ['Pop! You saved a friend!', 'Zoom! Saved!', 'Pow! Free!', 'Hooray, a friend is safe!', 'Super save!'];

export function rescueHitText(p, rng) {
  return `${rng.pick(SAVE)} ${equationText(p)}`;
}

export function rescueWordHitText(w, rng) {
  return `${rng.pick(SAVE)} That says ${w}.`;
}

export function rescueMissText() {
  return 'Boing! That bubble bounced away. Next one!';
}

export function rescueWinText(team) {
  return `You saved all ten friends! You are a super ${team === 'unicorn' ? 'unicorn' : 'hero'}!`;
}

export function rescueEscapeText(saved) {
  return `Great try! You saved ${saved} ${saved === 1 ? 'friend' : 'friends'}. The other bubbles floated away. Let's save them next time!`;
}
