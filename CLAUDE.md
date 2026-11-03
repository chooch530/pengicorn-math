# CLAUDE.md — Pengicorn Math

Read this before changing anything. Update it whenever we make a decision.

## What this is
iPad Safari math game for kids 5–7 (Calogero's two kids, 6 and 7). Penguins (addition),
unicorns (subtraction), Rainbow Castle (multiplication). 5–10 minute sessions. Must feel like a game.

## Status
- **v1.0 (Nov 2, 2026):** Penguin Island Level 1 end to end. Splash screen, kid select/add kid, map, 10-problem round, reward screen, minimal parent screen, offline support, home-screen manifest.
- **v1.1 (Nov 2, 2026):** Penguin Island Levels 2 (sums to 10) and 3 (sums to 20) with a level picker. Parent "Unlock all levels". Avoids repeating last round's problems. Auto-fit layout for every iPad/iPhone size, both orientations. Ten-frames for numbers above 5.
- **v1.2 (Nov 3, 2026):** The problem always reads on one line, left to right. Numbers only by default; per-kid "Counting pictures" switch in the parent area. In numbers mode, pictures pop in as the hint after a wrong answer.
- **v1.3 (Nov 3, 2026):** Mixed problems. Bands share the level max (only the floor rises), answers are picked evenly across sums, no back-to-back same answer, first number or flipped pair, and answer buttons are never sorted and are often non-consecutive.
- **Live at:** https://chooch530.github.io/pengicorn-math/ (repo chooch530/pengicorn-math, GitHub Pages from `main` root).
- **Next:** kid testing feedback. Do NOT build Unicorn Meadow or Rainbow Castle until Calogero confirms.
- **Not built yet:** Unicorn Meadow, Rainbow Castle, "My Friends" collection and unlockables.

## Hard rules (from the brief)
- No reading required. Every instruction is spoken. Every screen has a replay-audio button.
- ~~Countable objects are shown first~~ **Changed by Calogero (v1.2):** numbers only by default; counting pictures are a per-kid parent setting and always appear as the hint after a miss.
- Tap targets are at least 80px (we use 88px). Portrait and landscape. No keyboard for kids.
- No ads, no tracking, no accounts, no external links, no external fonts or CDNs.
- Wrong answers never feel like failure.
- Original SVG art only. No copyrighted characters.
- Plain HTML/CSS/JS ES modules. No build step, no dependencies.

## Decisions made
| Topic | Decision |
|---|---|
| Wrong-answer flow | 3 buttons. 1st miss: soft sound, button dims, objects glow in sequence ("Let's count… try again"). 2nd miss: reveal the answer, count aloud with number tags, say the equation, move on. (A hint *after* 2 misses was meaningless with 3 options.) |
| Level 1 range | Operands 0–5, sums 1–5. 0+0 excluded. 20 unique problems, so a round never repeats. Problems containing a 0 are drawn less often (25% chance of allowing them). |
| Bands | Each level has 3 difficulty bands in `logic/levels.js`. All bands reach the level max and only the minimum sum rises (L1 [1–5,2–5,3–5], L2 [3–10,5–10,7–10], L3 [6–20,10–20,13–20]). Calogero found narrow bands too easy and predictable (answers crept up in order). If a band runs out of unused problems, draw from the whole level. |
| Adaptive | 4 first-try-correct in a row: up a band. 2 not-first-try in a row: down a band. Only first-try counts as "right" internally. The kid never sees this. |
| Stars | First-try correct out of 10: 9–10 = 3, 6–8 = 2, else 1. Never 0. |
| Levels | Addition: L1 sums 1–5, L2 to 10, L3 to 20 (`logic/levels.js`). Penguin Island opens a level picker (icebergs 1–3, best stars shown). Locked levels speak how to open them. |
| Level up | Unlock the next level after 2 rounds in a row of 2+ stars, finished in the top band, played on the highest unlocked level. Replaying an easier level saves its band but never unlocks. After an unlock, the reward Play button goes straight to the new level. Parent can "Unlock all levels" (Calogero's 6- and 7-year-old shouldn't grind L1). |
| Progress shape | `kid.modes.add = { level (highest unlocked), bands: {level: band}, strongRounds, bestStars: {level: n}, recent: [ids of last round] }`. `normalizeKid()` migrates v1.0 saves (single `band`) on load. |
| Mixing | Pick the answer first (uniform over sums), then a problem with that answer, so big sums don't dominate. Avoid repeating the previous problem's answer, first number, or flipped pair (soft rule). |
| Repetition | Within a round: never repeat. Across rounds: avoid last round's problems when the band has other options (soft rule). L1 is inherently small (20 problems), which is why kids felt it repeated. |
| Layout fit | The problem is ALWAYS one row, left to right (A + B = ?); Calogero rejected the stacked layout as confusing for kids. `play.js fit()` shrinks `--obj` from 110px (floor 12px) until the row fits. Re-fits on resize/rotation and when the hint shows pictures. `.group` never shrinks (flex-shrink 0). The play grid column is `minmax(0, 1fr)` so wide content can't widen the page. |
| Object layout | ≤5: cluster (4 = 2×2, 5 = 3+2). >5: ten-frames (rows of 5, two rows per frame, soft box per ten). |
| Phones | Supported as a bonus (the iPad is the target). At ≤500px wide or ≤520px tall: 80px tap targets, kid name hidden in the chip. Phone landscape: Pip hidden, answers in a right-hand column. The parent gear on the map sits in the bottom-left corner, not the top bar. |
| Distractors | Within ±2, clamped to [0, level max]. Answer rank (lowest/middle/highest) picked evenly. Middle shapes include gaps (e.g. a-2, a, a+1) so the set is often non-consecutive. Button order is shuffled and re-shuffled if sorted ascending or descending. |
| Mute toggle | Mutes **sound effects only**, not speech. Speech is the instruction channel, and muting it makes the game unplayable for non-readers. Revisit if Calogero wants full silence. |
| Audio unlock | The splash Play tap unlocks speech and Web Audio (iOS requirement). Every tap also calls `sfx.unlock()` in case iOS suspended the context. |
| Speech | Rate 0.85, pitch 1.1. Prefers Enhanced/Premium en-US voices (Ava, Samantha…). Parent can pick a voice; the choice is saved. Spoken text always comes from `logic/words.js`, never from display strings. |
| Parent gate | Hold the gear 3s, then answer a×b (6–9 × 6–9) on a number pad. |
| Parent screen | Per kid: first-try accuracy, problems answered, levels open, stars, top-5 missed, reset, unlock all levels, delete. Also: voice picker, backup/restore code (base64 JSON). |
| Storage | localStorage key `pengicorn.v1`, schema 1, every call in try/catch. Max 3 kids. Home-screen launch is required: Safari tabs lose data after 7 days and keep separate storage from the icon. |
| Offline | `sw.js` cache-first. **Bump `VERSION` on every deploy** and add new files to `FILES`. `tests/sw.test.js` fails if a file is missing from `FILES`. |
| Art swap | Screens only call `art.character(kind, variant)` / `art.object(kind)` from `js/art/registry.js`. A sprite pack is a new provider passed to `setProvider()`. Animations are CSS classes on the returned element (`.bounce`, `.dance`, `.glow`, idle blink on `.eyes`). |
| Pictures setting | `kid.prefs.pictures` (default false, `normalizeKid` adds it to old saves). Off: big number cards, spoken "What is 2 plus 1?". On: objects with every problem plus the Pip story. Off-mode hint/reveal: `showPictures()` removes `.pics-off`, re-fits, then glows/counts as before. |
| Story text | Hero is "Pip" the penguin. Objects alternate between fish and snowballs. Zero cases have their own sentences ("Pip has no fish…", "Pip does not catch any more"). |

## Layout
```
index.html, manifest.webmanifest, sw.js, package.json (tests only)
css/styles.css
icons/ (generated by tools/make-icons.mjs from the in-code SVGs)
js/main.js            boot + router (app object shared by screens)
js/logic/             PURE, no DOM: rng, levels, problems, distractors, difficulty, scoring, round, progress, words
js/audio/             speech.js (Web Speech), sfx.js (Web Audio)
js/art/               registry.js (the only art entry point), penguin.js, unicorn.js, objects.js
js/ui/                dom, chrome (top bar, hold button), confetti, splash, kidSelect, home, levelSelect, play, reward, parent
tests/                node --test; no dependencies
```

## Deploying
- Commit and push to `main`; Pages redeploys in about a minute.
- **Bump `VERSION` in `sw.js` on every deploy** (v1.3.0 is current), or the iPad keeps the old cache.
- Claude's push access needs the Claude GitHub App *installed* on chooch530 with this repo selected. Being *authorized* is not enough.

## Commands
- `npm test` runs all unit tests (Node 18+).
- `python3 -m http.server 8080` serves locally. ES modules don't load from `file://`.
- Layout check: play rounds at L1–L3 in headless Chrome at 375×667, 393×852, 852×393, 744×1133, 810×1010, 1180×820 and 1024×1366. Run both pictures off and on, including a wrong answer (the hint). Assert no screen/equation overflow, no off-screen buttons, no answer buttons under 80px, and the equation children on one row in left-to-right order.

## Conventions
- Logic must stay DOM-free and take an `rng` so tests are deterministic.
- New screens export `render(app, params)` and return `{ el, enter?, cleanup? }`. `cleanup` must stop async chains (`alive = false`).
- All paths are relative (GitHub Pages serves under `/<repo>/`).
- Before adding subtraction, add `LEVELS.sub` and a `subtractionPool`, extend tests (no negative answers), and add the meadow theme.
