# Pengicorn Math

A math game with penguins and unicorns for kids ages 5–7, built for iPad Safari. This build includes Penguin Island Level 1, which is addition with sums up to 5.

## 1. Put it on GitHub Pages (about 10 minutes, one time)
1. Sign in at github.com and click **New repository**.
   - Name it something like `pengicorn-math`.
   - Make it **Public**, because free GitHub Pages needs a public repo.
2. On the empty repo page, click **uploading an existing file**.
   - Drag in everything inside this folder, keeping the `css`, `js`, `icons`, `tests` and `tools` folders.
   - Then click **Commit changes**.
3. Turn on Pages:
   - Go to **Settings → Pages**.
   - Under "Build and deployment", set Source to **Deploy from a branch**, Branch to **main**, and folder to **/ (root)**.
   - Click **Save**.
4. Wait 1–2 minutes. The site will be at `https://<your-username>.github.io/pengicorn-math/`.

**Updating later:** upload the changed files the same way, and change `VERSION` in `sw.js` (for example `v1.0.0` → `v1.0.1`). Without the version bump, the iPad keeps showing the old version.

## 2. Set up the iPad (do all of these)
1. **Add to Home Screen.** Open the link in Safari, tap the Share button, then tap **Add to Home Screen**. Always launch the game from that icon. Safari tabs can erase saved progress after 7 days without a visit, and the icon keeps its own separate progress.
2. **Download a better voice.** Go to Settings → Accessibility → Spoken Content → Voices → English, and download an **Enhanced** or **Premium** voice (Ava or Samantha). Then open the game's parent area (below) and choose it. The default voices sound robotic.
3. **Open it once while online.** After that, it works offline.
4. **Optional: Guided Access**, so a kid can't swipe out of the game. Turn it on in Settings → Accessibility → Guided Access. Then triple-click the top button while the game is open.

## Parent area
Hold the gear button for 3 seconds, then answer the multiplication question. Inside you'll find:
- Each kid's accuracy, the problems they miss most, and buttons to reset progress or delete a player.
- The voice picker.
- Backup and restore codes. Paste the backup code into Notes to keep it safe.

## For development
- `npm test` runs the unit tests. It needs Node 18 or newer and has no dependencies.
- `python3 -m http.server 8080` serves the game locally, then open http://localhost:8080. Opening `index.html` directly from the file won't work.
- See `CLAUDE.md` for design decisions.
