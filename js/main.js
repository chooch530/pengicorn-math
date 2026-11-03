// Boot + tiny screen router. Holds the app state that screens share.
import { loadStore, saveStore } from './logic/progress.js';
import * as speech from './audio/speech.js';
import * as sfxMod from './audio/sfx.js';
import * as splash from './ui/splash.js';
import * as kidSelect from './ui/kidSelect.js';
import * as home from './ui/home.js';
import * as play from './ui/play.js';
import * as levelSelect from './ui/levelSelect.js';
import * as reward from './ui/reward.js';

const SCREENS = {
  splash: splash.render,
  kids: kidSelect.render,
  addKid: kidSelect.renderAddKid,
  home: home.render,
  levels: levelSelect.render,
  play: play.render,
  reward: reward.render,
};

const root = document.getElementById('app');
let current = null;
let currentName = 'splash';
let currentParams = {};

const app = {
  store: loadStore(),
  kidId: null,

  get kid() {
    return this.store.kids.find((k) => k.id === this.kidId) || null;
  },
  setKid(id) {
    this.kidId = id;
  },
  updateKid(kid) {
    const i = this.store.kids.findIndex((k) => k.id === kid.id);
    if (i >= 0) this.store.kids[i] = kid;
    this.save();
  },
  replaceStore(s) {
    this.store = s;
    this.kidId = null;
    this.save();
  },
  save() {
    saveStore(this.store);
  },
  setMuted(m) {
    this.store.settings.muted = m;
    sfxMod.setMuted(m);
    this.save();
  },
  unlockAudio() {
    speech.unlock();
    sfxMod.unlock();
  },
  go(name, params = {}) {
    current?.cleanup?.();
    speech.stop();
    document.querySelectorAll('.overlay').forEach((o) => o.remove());
    currentName = name;
    currentParams = params;
    const screen = SCREENS[name](app, params);
    if (!screen) return; // screen redirected
    current = screen;
    root.replaceChildren(screen.el);
    screen.enter?.();
  },
  /** Re-render the current screen (e.g. after parent changes). */
  refresh() {
    if (currentName === 'play' || currentName === 'reward') return;
    if (!this.kid && currentName === 'home') return this.go('kids');
    if (!this.store.kids.length && currentName !== 'splash') return this.go('addKid');
    this.go(currentName, currentParams);
  },
};

sfxMod.setMuted(app.store.settings.muted);
if (app.store.settings.voiceURI) speech.setVoice(app.store.settings.voiceURI);

// Any tap anywhere also re-unlocks audio (iOS can suspend it when the app is backgrounded).
document.addEventListener('pointerdown', () => sfxMod.unlock(), { passive: true });
// Block pinch-zoom gestures on iOS Safari.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => {
  if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
});

app.go('splash');

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// For debugging in the browser console only.
globalThis.__app = app;
