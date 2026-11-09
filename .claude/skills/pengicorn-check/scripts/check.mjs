// Pengicorn browser check: plays real rounds in headless Chromium at iPad and iPhone sizes,
// asserts layout rules from CLAUDE.md, and saves screenshots.
//
// Usage (from the repo root):
//   node .claude/skills/pengicorn-check/scripts/check.mjs [--flows heroes,math,battle] [--sizes 1180x820,375x667] [--out DIR]
//
// Starts `python3 -m http.server 8080` itself if nothing is listening there.
// Speech is faked (finishes in 30 ms) so rounds don't wait on text-to-speech.
// Exit code 0 = no problems found, 1 = problems (listed at the end).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright not found. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const ALL_SIZES = '375x667,393x852,852x393,744x1133,810x1010,1180x820,1024x1366';
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const flows = arg('flows', 'heroes,math,battle').split(',');
const sizes = arg('sizes', ALL_SIZES).split(',').map((s) => s.split('x').map(Number));
const out = resolve(arg('out', 'check-shots'));
const BASE = 'http://localhost:8080/';
mkdirSync(out, { recursive: true });

// ---- local server ----
async function up() {
  try {
    return (await fetch(BASE)).ok;
  } catch {
    return false;
  }
}
let server = null;
if (!(await up())) {
  server = spawn('python3', ['-m', 'http.server', '8080'], { stdio: 'ignore' });
  for (let i = 0; i < 30 && !(await up()); i++) await new Promise((r) => setTimeout(r, 200));
  if (!(await up())) {
    console.error('Could not start the local server on port 8080.');
    process.exit(2);
  }
}

const problems = [];
const browser = await chromium.launch();

async function newPage(w, h, tag) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => problems.push(`${tag} page error: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && problems.push(`${tag} console: ${m.text()}`));
  await page.addInitScript(() => {
    const synth = {
      speaking: false, pending: false, getVoices: () => [], cancel() {}, pause() {}, resume() {}, addEventListener() {},
      speak(u) { setTimeout(() => { u.onstart?.(); u.onend?.(); }, 30); },
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth });
  });
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.mode-card');
  return page;
}

const shot = (page, name) => page.screenshot({ path: join(out, `${name}.png`) });

async function addKid(page, name) {
  await page.waitForSelector('.add-kid input');
  await page.fill('.add-kid input', name);
  await page.click('button[aria-label="Done"]');
}

/** The right answer from what's on screen (works for + and −, pictures on or off). */
function answerOnScreen(page) {
  return page.evaluate(() => {
    const eq = document.querySelector('.equation');
    const nums = [...eq.querySelectorAll('.num')].map((n) => +n.textContent);
    return eq.querySelector('.sym').textContent === '−' ? nums[0] - nums[1] : nums[0] + nums[1];
  });
}

/** CLAUDE.md layout rules for a math screen. */
async function checkMathLayout(page, tag, when) {
  const r = await page.evaluate(() => {
    const s = document.querySelector('.screen');
    const eq = document.querySelector('.equation');
    const kids = [...eq.children].map((c) => c.getBoundingClientRect());
    const oneRow = kids.every((k, i) => i === 0 || (k.left >= kids[i - 1].left && Math.abs(k.top + k.height / 2 - (kids[0].top + kids[0].height / 2)) < kids[0].height));
    const badButtons = [...document.querySelectorAll('.answers .answer')].filter((b) => {
      const x = b.getBoundingClientRect();
      return x.bottom > innerHeight + 1 || x.right > innerWidth + 1 || x.left < -1 || x.height < 79 || x.width < 79;
    }).length;
    return {
      screenOverflow: s.scrollHeight > s.clientHeight + 1 || s.scrollWidth > s.clientWidth + 1,
      equationOverflow: eq.scrollWidth > eq.clientWidth + 1,
      oneRow,
      badButtons,
    };
  });
  if (r.screenOverflow || r.equationOverflow || !r.oneRow || r.badButtons) problems.push(`${tag} ${when} layout: ${JSON.stringify(r)}`);
}

/**
 * Play one 10-question math round. missAt = question numbers to get fully wrong (hint, then reveal).
 * Waits for the hint to finish before the second wrong tap (CLAUDE.md).
 */
async function playMathRound(page, tag, label, missAt = []) {
  await page.waitForSelector('.answers .answer', { timeout: 20000 });
  for (let q = 0; q < 10; q++) {
    await page.waitForFunction(() => document.querySelector('.answers .answer:not([disabled])') && document.querySelector('.qmark')?.textContent === '?', null, { timeout: 30000 });
    const ans = await answerOnScreen(page);
    if (q === 3) await checkMathLayout(page, tag, `${label} q${q}`);
    if (missAt.includes(q)) {
      for (let t = 0; t < 2; t++) {
        await page.waitForFunction(() => document.querySelector('.answers .answer:not([disabled])'), null, { timeout: 30000 });
        const bs = await page.$$('.answers .answer:not([disabled])');
        const vals = await Promise.all(bs.map((b) => b.textContent()));
        await bs[vals.findIndex((v) => +v !== ans)].click();
        if (t === 0) {
          await page.waitForTimeout(1800);
          await shot(page, `${label}-hint-q${q}-${tag}`);
          await checkMathLayout(page, tag, `${label} hint q${q}`);
          await page.waitForTimeout(2500);
        }
      }
      await page.waitForFunction(() => document.querySelector('.qmark')?.textContent !== '?', null, { timeout: 30000 });
      continue;
    }
    if (q === 4) await shot(page, `${label}-q4-${tag}`);
    await page.click(`.answers .answer[aria-label="${ans}"]`);
  }
  await page.waitForSelector('.reward', { timeout: 40000 });
  await page.waitForTimeout(900);
  await shot(page, `${label}-reward-${tag}`);
}

async function checkCardsOnScreen(page, tag, what) {
  const off = await page.evaluate(() =>
    [...document.querySelectorAll('.mode-card')].map((c) => c.getBoundingClientRect()).filter((r) => r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < 0 || r.top < 0).length
  );
  if (off) problems.push(`${tag} ${what}: ${off} card(s) off screen`);
}

// ---- flows ----

async function heroes(w, h, tag) {
  const page = await newPage(w, h, tag);
  await shot(page, `splash-${tag}`);
  await checkCardsOnScreen(page, tag, 'splash');
  await page.click('.mode-heroes');
  await addKid(page, 'Mia');
  await page.waitForSelector('.team-card');
  await checkCardsOnScreen(page, tag, 'team picker');
  // Alternate teams across sizes so both themes get checked.
  const team = sizes.findIndex(([a, b]) => a === w && b === h) % 2 ? 'Super unicorns' : 'Super heroes';
  await page.click(`button[aria-label="${team}"]`);
  await page.waitForSelector('.path-stop.now');
  await page.waitForTimeout(500);
  await shot(page, `heroes-path-${tag}`);

  await page.click('.path-stop.now');
  await playMathRound(page, tag, 'heroes-stop1');
  await page.click('button[aria-label="Play again"]');
  await playMathRound(page, tag, 'heroes-stop2', [2, 5]);
  await page.click('button[aria-label="Play again"]');
  await page.waitForSelector('.word-card', { timeout: 20000 });
  await page.waitForTimeout(800);
  await shot(page, `heroes-words-${tag}`);
  const cut = await page.evaluate(() => {
    const s = document.querySelector('.screen');
    return [...document.querySelectorAll('.word-card')].some((c) => c.scrollWidth > c.clientWidth + 1) || s.scrollHeight > s.clientHeight + 1;
  });
  if (cut) problems.push(`${tag} heroes words: card text cut off or screen overflow`);
  await page.click('button[aria-label="Home"]');
  await page.waitForSelector('.path-stop.now');
  await page.waitForTimeout(500);
  await shot(page, `heroes-path-after-${tag}`);
  const p = await page.evaluate(() => ({ done: __app.kid.modes.path.done, stars: __app.kid.modes.path.stars }));
  if (p.done !== 2 || p.stars[0] !== 3 || !p.stars[1]) problems.push(`${tag} heroes path progress wrong: ${JSON.stringify(p)}`);
  const offPath = await page.evaluate(() => {
    const t = document.querySelector('.hero-path .topbar').getBoundingClientRect();
    const hero = document.querySelector('.path-hero')?.getBoundingClientRect();
    return { topbar: t.right > innerWidth + 1, hero: hero ? hero.right > innerWidth + 1 || hero.left < 0 : false };
  });
  if (offPath.topbar || offPath.hero) problems.push(`${tag} heroes path off screen: ${JSON.stringify(offPath)}`);
  await page.close();
}

async function math(w, h, tag) {
  const page = await newPage(w, h, tag);
  await page.click('.mode-math');
  await addKid(page, 'Leo');
  await page.click('.place-island');
  await page.click('.level-card');
  await playMathRound(page, tag, 'penguin', [3]);
  const n = await page.evaluate(() => __app.kid.stats.add.problems);
  if (n !== 10) problems.push(`${tag} penguin: expected 10 problems recorded, got ${n}`);
  await page.close();
}

async function battle(w, h, tag) {
  const page = await newPage(w, h, tag);
  await page.click('.mode-battle');
  await addKid(page, 'Ava');
  await page.click('.level-card');
  await playMathRound(page, tag, 'battle', [5]);
  await page.close();
}

const FLOWS = { heroes, math, battle };
for (const [w, h] of sizes) {
  const tag = `${w}x${h}`;
  for (const f of flows) {
    if (!FLOWS[f]) {
      problems.push(`unknown flow "${f}" (use ${Object.keys(FLOWS).join(', ')})`);
      continue;
    }
    try {
      await FLOWS[f](w, h, tag);
      console.log(`ok   ${f} ${tag}`);
    } catch (e) {
      problems.push(`${tag} ${f} crashed: ${e.message.split('\n')[0]}`);
      console.log(`FAIL ${f} ${tag}`);
    }
  }
}

await browser.close();
server?.kill();
console.log(`\nScreenshots: ${out}`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('\nNo problems found.');
