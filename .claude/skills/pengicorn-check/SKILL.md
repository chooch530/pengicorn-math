---
name: pengicorn-check
description: Play real Pengicorn rounds in headless Chromium at iPad and iPhone sizes, check the CLAUDE.md layout rules, and save screenshots. Use after any change to screens, CSS, play logic or art, before committing or deploying, or when asked to "check the game", "test the layout", or "make sure it works on the iPad".
---

# Pengicorn browser check

Runs the game the way a kid would: a new player, real rounds, right and wrong answers. Speech is faked so rounds run fast. This complements `npm test`, which covers logic only.

## Run it

From the repo root:

```bash
npm test
node .claude/skills/pengicorn-check/scripts/check.mjs --out <scratchpad>/check-shots
```

Options:
- `--flows heroes,math,battle` (default: all three)
  - `heroes`: splash → new kid → team → path; stop 1 perfect, stop 2 (subtraction) with 2 reveals, stop 3 (words); path progress and stars.
  - `math`: Penguin Island L1 round with a hint and a reveal.
  - `battle`: Battleship L1 round with a reveal.
- `--sizes 1180x820,375x667` (default: the 7 sizes from CLAUDE.md: 375x667, 393x852, 852x393, 744x1133, 810x1010, 1180x820, 1024x1366)
- `--out DIR` for screenshots. Put them in the scratchpad, never in the repo.

The script starts `python3 -m http.server 8080` if nothing is serving there. A full run (3 flows × 7 sizes) takes about 10 minutes, so run it in the background or narrow `--sizes` while iterating, then do one full run before committing.

## What it asserts

- No page errors or console errors.
- Splash and team cards fully on screen.
- Math screens: no screen or equation overflow, equation children on one row left to right, answer buttons on screen and at least 80px.
- Hints and reveals keep the layout (checked while the hint pictures are showing).
- Words cards: no cut-off text.
- Hero Path: 2 stops done after 2 rounds, best stars saved, top bar and hero on screen.

Exit code 0 = clean, 1 = problems (listed at the end), 2 = setup problem (Playwright or the server).

## After it runs

1. Look at several screenshots yourself, at least one phone portrait, one phone landscape and one iPad per changed screen. The asserts catch overflow, not ugliness (overlapping art, clipped characters, empty bands).
2. Report the results plainly: which flows and sizes passed, any problems, and what you looked at.
3. Not covered: real iPad Safari, real voices, the Words Classic and Pirate ship games, and the photo list editor. Say so if your change touched them, and check them by hand per CLAUDE.md "Commands".

## Extending

Add a flow as an async `(w, h, tag)` function in `scripts/check.mjs` and register it in `FLOWS`. Reuse `newPage`, `addKid`, `playMathRound` and `shot`. When a new game or screen ships, add its flow here in the same commit.
