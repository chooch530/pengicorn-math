// Heroes world home: a SplashLearn-style path. One winding trail of missions played in order.
// Finished stops show their best stars; the next stop glows with the kid's hero standing on it;
// later stops are locked. Every stop is a 10-question rescue mission (see logic/path.js).
import { h, svg, icons, animate } from './dom.js';
import { art } from '../art/registry.js';
import { starSVG } from '../art/objects.js';
import { teamCharacter } from '../art/hero.js';
import { topbar, homeButton, starCount, holdButton } from './chrome.js';
import { sfx } from '../audio/sfx.js';
import * as speech from '../audio/speech.js';
import { openParentGate } from './parent.js';
import { PATH, isOpen, currentStop, isComplete } from '../logic/path.js';

const GLYPH = { add: '+', sub: '−', mix: '±', words: 'abc' };
const ROW = 132; // px between stops
const HEADER = 160; // px for a chapter banner (keeps it clear of the first stop and its hero)

export function render(app) {
  const kid = app.kid;
  if (!kid) return app.go('kids');
  if (!kid.prefs?.team) return app.go('heroTeam');

  const progress = kid.modes.path;
  const now = currentStop(progress);
  const who = teamCharacter(kid);

  // Lay the stops out top to bottom, swinging left and right, with a banner at each chapter start.
  const items = [];
  let y = 40;
  PATH.forEach((stop, i) => {
    if (i === 0 || PATH[i - 1].chapter !== stop.chapter) {
      items.push({ type: 'chapter', chapter: stop.chapter, y });
      y += HEADER;
    }
    items.push({ type: 'stop', stop, index: i, y, x: 50 + 26 * Math.sin(i * 0.95) });
    y += ROW;
  });
  const height = y + 40;
  const stops = items.filter((it) => it.type === 'stop');

  const trail = svg(
    `<svg class="path-trail" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${stops.map((s) => `${s.x},${s.y}`).join(' ')}" fill="none" stroke="#ffffff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity="0.85"/>
      <polyline points="${stops.map((s) => `${s.x},${s.y}`).join(' ')}" fill="none" stroke="#c9b8ff" stroke-width="6" stroke-dasharray="2 16" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    </svg>`
  );

  let currentEl = null;
  const nodes = items.map((it) => {
    if (it.type === 'chapter') {
      const chapterStops = stops.filter((s) => s.stop.chapter === it.chapter);
      const got = chapterStops.reduce((n, s) => n + (progress.stars[s.index] || 0), 0);
      return h(
        'div',
        { class: `chapter-banner chapter-${it.chapter}`, style: { top: `${it.y}px` } },
        h('span', { class: 'chapter-num' }, String(it.chapter)),
        svg(starSVG()),
        h('span', {}, `${got}/${chapterStops.length * 3}`)
      );
    }
    const { stop, index } = it;
    const open = isOpen(progress, index);
    const done = index < progress.done;
    const isNow = index === now && !isComplete(progress);
    const best = progress.stars[index] || 0;
    const node = h(
      'button',
      {
        class: `path-stop skill-${stop.skill}${done ? ' done' : ''}${isNow ? ' now' : ''}${open ? '' : ' locked'}`,
        style: { top: `${it.y}px`, left: `${it.x}%` },
        'aria-label': `Mission ${index + 1}${open ? '' : ' (locked)'}`,
        onclick: () => {
          if (!open) {
            sfx.tryAgain();
            animate(node, 'wiggle', 500);
            speech.speak('That mission is locked. Play the glowing one first!', { remember: false });
            return;
          }
          sfx.tap();
          app.go('heroStop', { stop: index });
        },
      },
      open ? h('span', { class: 'stop-glyph' }, GLYPH[stop.skill]) : icons.lock(),
      done ? h('div', { class: 'stop-stars' }, [0, 1, 2].map((k) => svg(starSVG(k < best ? '#ffd23f' : '#e4e0f0')))) : null
    );
    if (isNow) {
      currentEl = node;
      const buddy = art.character(who.kind, who.variant, { className: `float path-hero${it.x > 50 ? ' hero-left' : ''}` });
      node.append(buddy);
    }
    return node;
  });

  const scroller = h('div', { class: 'path-scroll' }, h('div', { class: 'path-track', style: { height: `${height}px` } }, trail, ...nodes));

  const teamChip = h(
    'button',
    {
      class: 'kid-chip btn',
      style: { padding: '0 16px 0 6px', fontSize: '26px' },
      'aria-label': 'Change team',
      onclick: () => {
        sfx.tap();
        app.go('heroTeam');
      },
    },
    art.character(who.kind, who.variant),
    h('span', { class: 'kid-name' }, kid.name)
  );

  const el = h(
    'div',
    { class: 'screen hero-path' },
    topbar(app, { left: [homeButton(app, 'splash'), teamChip, starCount(kid.totalStars)] }),
    scroller,
    h('div', { class: 'corner-gear' }, holdButton(() => openParentGate(app)))
  );

  return {
    el,
    enter() {
      document.body.dataset.theme = who.team === 'unicorn' ? 'rainbow' : 'hero';
      // Bring the glowing stop into view.
      requestAnimationFrame(() => currentEl?.scrollIntoView({ block: 'center' }));
      speech.speak(
        isComplete(progress)
          ? `Wow, ${kid.name}! You finished every mission! Tap any one to play it again.`
          : progress.done === 0
            ? `Hi ${kid.name}! Friends are stuck in bubbles. Tap the glowing circle to start your first mission!`
            : `Welcome back, ${kid.name}! Tap the glowing circle for your next mission.`
      );
    },
  };
}
