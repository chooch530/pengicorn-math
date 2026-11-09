// Heroes world rescue scene: 10 friends trapped in bubbles under a grumpy cloud.
// A right answer: the kid's hero flies up, pops a bubble, and the friend floats down safe.
// A full miss: the hero bounces off the bubble ("Boing!"). Same interface as battleScene:
//   fire(hit, part) and finale(won), so play.js / wordsPlay.js treat both the same.
// Two looks: 'hero' (city skyline, blue sky) and 'unicorn' (pastel sky, rainbow, cloud castle).
import { art } from '../art/registry.js';
import { teamCharacter } from '../art/hero.js';
import { sfx } from '../audio/sfx.js';

const NS = 'http://www.w3.org/2000/svg';
const BUBBLE_R = 30;
// Two rows of five bubbles, offset like a honeycomb.
const SPOTS = Array.from({ length: 10 }, (_, i) => ({
  x: i < 5 ? 236 + i * 76 : 198 + (i - 5) * 76,
  y: i < 5 ? 92 : 160,
}));
const HERO_HOME = { x: 14, y: 128, w: 120, h: 132 };
const GROUND_Y = 252;

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.append(e);
  return e;
}

function tween(ms, fn) {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      fn(t);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t) => 1 - (1 - t) * (1 - t);

const THEMES = {
  hero: { skyTop: '#5fb6ff', skyBottom: '#dff3ff', ground: '#6d5bd0', groundTop: '#8b7be6' },
  unicorn: { skyTop: '#c9a7ff', skyBottom: '#ffe1f0', ground: '#ffffff', groundTop: '#fff4fb' },
};

export function createRescueScene(kid) {
  const who = teamCharacter(kid);
  const T = THEMES[who.team];
  const svg = el('svg', { viewBox: '0 0 600 300', class: 'battle-scene rescue-scene', preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
  const defs = el('defs', {}, svg);
  const sky = el('linearGradient', { id: 'rsky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: '0', 'stop-color': T.skyTop }, sky);
  el('stop', { offset: '1', 'stop-color': T.skyBottom }, sky);

  // Sky runs far past the box so wide or tall screens show no empty bands.
  el('rect', { x: -2000, y: -2000, width: 4600, height: 2001, fill: T.skyTop }, svg);
  el('rect', { x: -2000, y: 0, width: 4600, height: 300, fill: 'url(#rsky)' }, svg);
  el('rect', { x: -2000, y: 300, width: 4600, height: 2000, fill: T.ground }, svg);

  if (who.team === 'unicorn') drawRainbowLand(svg);
  else drawCity(svg);

  // The grumpy cloud that trapped everyone (silly, not scary).
  const cloud = el('g', { transform: 'translate(392 26)' }, svg);
  el('animateTransform', { attributeName: 'transform', type: 'translate', values: '392 26; 400 24; 392 26', dur: '4s', repeatCount: 'indefinite' }, cloud);
  const puffs = [[-50, 6, 26], [-20, -8, 32], [18, -6, 30], [48, 6, 24], [0, 12, 30]];
  const cloudShapes = puffs.map(([cx, cy, r]) => el('circle', { cx, cy, r, fill: '#8f96a8' }, cloud));
  el('path', { d: 'M-22 -6 L-10 -1 M22 -6 L10 -1', stroke: '#3b3f4d', 'stroke-width': 4, 'stroke-linecap': 'round' }, cloud);
  el('circle', { cx: -14, cy: 6, r: 4, fill: '#3b3f4d' }, cloud);
  el('circle', { cx: 14, cy: 6, r: 4, fill: '#3b3f4d' }, cloud);
  const mouth = el('path', { d: 'M-10 22 Q0 14 10 22', stroke: '#3b3f4d', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, cloud);

  // Ground strip where rescued friends land.
  el('rect', { x: -2000, y: GROUND_Y + 8, width: 4600, height: 60, fill: T.ground }, svg);
  el('rect', { x: -2000, y: GROUND_Y + 8, width: 4600, height: 8, fill: T.groundTop }, svg);

  // Bubbles, each holding a friend. Outer group = position, inner = gentle bob.
  const bubbles = SPOTS.map((s, i) => {
    const g = el('g', { transform: `translate(${s.x} ${s.y})` }, svg);
    const bob = el('g', {}, g);
    el('animateTransform', { attributeName: 'transform', type: 'translate', values: `0 0; 0 ${i % 2 ? 5 : -5}; 0 0`, dur: `${2.4 + (i % 3) * 0.4}s`, repeatCount: 'indefinite' }, bob);
    const friend = art.buddy(i);
    Object.entries({ x: -21, y: -21, width: 42, height: 42 }).forEach(([k, v]) => friend.setAttribute(k, v));
    bob.append(friend);
    const shell = el('circle', { r: BUBBLE_R, fill: '#ffffff', 'fill-opacity': 0.28, stroke: '#ffffff', 'stroke-width': 3, 'stroke-opacity': 0.9 }, bob);
    el('path', { d: 'M-18 -12 Q-14 -22 -4 -24', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none', opacity: 0.85 }, bob);
    return { g, bob, friend, shell, x: s.x, y: s.y, popped: false };
  });

  // The kid's team character.
  const hero = art.character(who.kind, who.variant);
  hero.classList.remove('char'); // keep page-level .char sizing off the nested svg
  const place = (x, y, w = HERO_HOME.w, h = HERO_HOME.h) =>
    Object.entries({ x, y, width: w, height: h }).forEach(([k, v]) => hero.setAttribute(k, v));
  place(HERO_HOME.x, HERO_HOME.y);
  svg.append(hero);

  const fx = el('g', {}, svg);
  let saved = 0;

  function sparkles(x, y, n = 8, color = '#ffd23f') {
    const g = el('g', {}, fx);
    const dots = Array.from({ length: n }, (_, k) => {
      const a = (2 * Math.PI * k) / n;
      return { e: el('circle', { cx: x, cy: y, r: 4, fill: k % 2 ? '#fff' : color }, g), dx: Math.cos(a), dy: Math.sin(a) };
    });
    return tween(600, (t) => {
      for (const d of dots) {
        d.e.setAttribute('cx', x + d.dx * 44 * easeOut(t));
        d.e.setAttribute('cy', y + d.dy * 44 * easeOut(t));
      }
      g.setAttribute('opacity', 1 - t);
    }).then(() => g.remove());
  }

  /** Fly the hero so its hands end up near (x, y); returns when it arrives. */
  async function flyTo(x, y, ms = 520) {
    sfx.whoosh();
    const from = { x: Number(hero.getAttribute('x')), y: Number(hero.getAttribute('y')) };
    const to = { x: x - HERO_HOME.w * 0.25, y: y - HERO_HOME.h * 0.55 };
    let trail = 0;
    await tween(ms, (t) => {
      const e = easeInOut(t);
      const arc = Math.sin(Math.PI * t) * -30;
      const hx = from.x + (to.x - from.x) * e;
      const hy = from.y + (to.y - from.y) * e + arc;
      place(hx, hy);
      if (t * 8 > trail) {
        trail++;
        const dot = el('circle', { cx: hx + HERO_HOME.w / 2, cy: hy + HERO_HOME.h * 0.8, r: 5, fill: who.team === 'unicorn' ? ['#ff6b9d', '#ffb347', '#7ed957', '#5bc0ff', '#b07cff'][trail % 5] : '#ffd23f' }, fx);
        tween(500, (k) => dot.setAttribute('opacity', 1 - k)).then(() => dot.remove());
      }
    });
  }

  async function flyHome() {
    const from = { x: Number(hero.getAttribute('x')), y: Number(hero.getAttribute('y')) };
    await tween(480, (t) => {
      const e = easeInOut(t);
      place(from.x + (HERO_HOME.x - from.x) * e, from.y + (HERO_HOME.y - from.y) * e);
    });
  }

  function landingSpot(k) {
    return { x: 168 + k * 42, y: GROUND_Y - 14 };
  }

  return {
    el: svg,
    /** One rescue attempt. hit=true pops bubble `part` (0–9). */
    async fire(hit, part) {
      if (hit) {
        const b = bubbles[part];
        await flyTo(b.x, b.y);
        // Pop: the bubble shell bursts, the friend floats down to the ground.
        b.popped = true;
        sfx.pop();
        const ring = el('circle', { cx: b.x, cy: b.y, r: BUBBLE_R, fill: 'none', stroke: '#fff', 'stroke-width': 4 }, fx);
        tween(300, (t) => {
          ring.setAttribute('r', BUBBLE_R + 22 * t);
          ring.setAttribute('opacity', 1 - t);
        }).then(() => ring.remove());
        sparkles(b.x, b.y);
        b.shell.remove();
        b.bob.lastElementChild.remove(); // shine
        // Move the friend out of the bobbing bubble so it can float down on its own.
        b.g.remove();
        b.friend.setAttribute('x', b.x - 21);
        b.friend.setAttribute('y', b.y - 21);
        fx.append(b.friend);
        const spot = landingSpot(saved++);
        const homeTrip = flyHome();
        await tween(700, (t) => {
          const e = easeInOut(t);
          b.friend.setAttribute('x', b.x - 21 + (spot.x - b.x) * e);
          b.friend.setAttribute('y', b.y - 21 + (spot.y - b.y) * e - Math.sin(Math.PI * t) * 20);
        });
        sfx.sparkle();
        await homeTrip;
      } else {
        // Gentle miss: the hero bounces off a bubble that wobbles. Boing!
        const left = bubbles.filter((b) => !b.popped);
        const b = left[Math.floor(Math.random() * left.length)] || bubbles[0];
        await flyTo(b.x - 40, b.y + 10, 460);
        sfx.boing();
        await tween(500, (t) => {
          const s = 1 + Math.sin(t * Math.PI * 4) * 0.15 * (1 - t);
          b.g.setAttribute('transform', `translate(${b.x} ${b.y}) scale(${s} ${2 - s})`);
        });
        await flyHome();
      }
    },
    /** End of round: everyone saved (cloud cheers up, friends hop), or the rest float away. */
    async finale(won) {
      if (won) {
        sfx.sparkle();
        for (const c of cloudShapes) c.setAttribute('fill', '#ffffff');
        mouth.setAttribute('d', 'M-12 14 Q0 28 12 14');
        const friends = bubbles.map((b) => b.friend);
        const baseY = friends.map((f) => Number(f.getAttribute('y')));
        sparkles(300, 120, 12, '#ff6b9d');
        await tween(1800, (t) => {
          friends.forEach((f, k) => {
            const hop = Math.abs(Math.sin(t * Math.PI * 4 + k * 0.6)) * 22;
            f.setAttribute('y', baseY[k] - hop);
          });
          place(HERO_HOME.x, HERO_HOME.y - Math.abs(Math.sin(t * Math.PI * 3)) * 26);
        });
        sfx.sparkle();
        await sparkles(300, 120, 12, '#5bc0ff');
      } else {
        sfx.whoosh();
        const left = bubbles.filter((b) => !b.popped);
        await tween(2600, (t) => {
          const e = t * t;
          for (const b of left) b.g.setAttribute('transform', `translate(${b.x + Math.sin(t * 6 + b.x) * 8} ${b.y - e * 360})`);
          cloud.setAttribute('opacity', 1 - t);
        });
      }
    },
  };
}

function drawCity(svg) {
  el('circle', { cx: 70, cy: 48, r: 28, fill: '#ffd23f' }, svg);
  const colors = ['#7b6ee0', '#9a8cf0', '#6a5cd0', '#8c7ff0'];
  const buildings = [[150, 150, 50], [205, 120, 44], [252, 170, 56], [312, 135, 40], [356, 160, 60], [420, 115, 46], [470, 150, 52], [526, 128, 48], [578, 160, 60], [-40, 160, 60], [-10, 130, 40]];
  buildings.forEach(([x, top, w], i) => {
    el('rect', { x, y: top, width: w, height: 300 - top, fill: colors[i % colors.length], rx: 4 }, svg);
    for (let wy = top + 12; wy < 250; wy += 22) {
      for (let wx = x + 8; wx < x + w - 10; wx += 14) el('rect', { x: wx, y: wy, width: 7, height: 10, fill: '#fff4a8', opacity: 0.7, rx: 1.5 }, svg);
    }
  });
}

function drawRainbowLand(svg) {
  const bands = ['#ff6b9d', '#ffb347', '#ffe066', '#7ed957', '#5bc0ff', '#b07cff'];
  bands.forEach((c, i) => el('path', { d: `M${60 + i * 10} 260 A ${240 - i * 10} ${200 - i * 10} 0 0 1 ${540 - i * 10} 260`, stroke: c, 'stroke-width': 10, fill: 'none', opacity: 0.55 }, svg));
  // Cloud castle.
  const castle = el('g', { transform: 'translate(500 150)', fill: '#ffffff', opacity: 0.9 }, svg);
  el('rect', { x: 0, y: 30, width: 80, height: 80 }, castle);
  el('rect', { x: -12, y: 4, width: 24, height: 106 }, castle);
  el('rect', { x: 68, y: 4, width: 24, height: 106 }, castle);
  el('path', { d: 'M-16 6 L0 -22 L16 6 Z M64 6 L80 -22 L96 6 Z', fill: '#ff8fc8' }, castle);
  el('path', { d: 'M28 110 V82 Q40 68 52 82 V110 Z', fill: '#c9a7ff' }, castle);
  // Fluffy cloud floor.
  for (let x = -40; x < 660; x += 54) el('circle', { cx: x, cy: 262, r: 34, fill: '#ffffff' }, svg);
}
