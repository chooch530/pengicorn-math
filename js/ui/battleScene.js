// Battleship scene: sea, enemy ship (10 hittable parts), the kid on a little cannon boat.
// fire(hit, part) animates one shot; finale(sunk) sinks the ship or lets it sail away.
// Animations use requestAnimationFrame and SVG attributes (reliable in iPad Safari).
import { art } from '../art/registry.js';
import { sfx } from '../audio/sfx.js';

const NS = 'http://www.w3.org/2000/svg';
const SHIP_X = 150;
const SHIP_Y = 72;
const MUZZLE = { x: 150, y: 222 };

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

const easeIn = (t) => t * t;
const easeOut = (t) => 1 - (1 - t) * (1 - t);

export function createBattleScene(kid) {
  const svg = el('svg', { viewBox: '0 0 600 300', class: 'battle-scene', preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
  const defs = el('defs', {}, svg);
  const sky = el('linearGradient', { id: 'bsky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: '0', 'stop-color': '#8fd3ff' }, sky);
  el('stop', { offset: '1', 'stop-color': '#e2f5ff' }, sky);
  const sea = el('linearGradient', { id: 'bsea', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: '0', 'stop-color': '#3aa0e8' }, sea);
  el('stop', { offset: '1', 'stop-color': '#1d6fb8' }, sea);

  // Sky and sea run far past the 600x300 box so wide or tall screens show no empty bands
  // (the svg overflows; its container clips).
  el('rect', { x: -2000, y: -2000, width: 4600, height: 2300, fill: '#e2f5ff' }, svg);
  el('rect', { x: -2000, y: 0, width: 4600, height: 300, fill: 'url(#bsky)' }, svg);
  el('rect', { x: -2000, y: -2000, width: 4600, height: 2000, fill: '#8fd3ff' }, svg);
  el('circle', { cx: 548, cy: 48, r: 30, fill: '#ffd23f' }, svg);
  el('path', { d: 'M-2000 200 H0 Q50 192 100 200 T200 200 T300 200 T400 200 T500 200 T600 200 H2600 V2300 H-2000 Z', fill: '#5bb5f0' }, svg);

  // Enemy ship: outer group moves (sink / sail away), inner group bobs.
  const shipMove = el('g', { transform: `translate(${SHIP_X} ${SHIP_Y})` }, svg);
  const shipBob = el('g', {}, shipMove);
  el('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0; 0 -4; 0 0', dur: '3.2s', repeatCount: 'indefinite' }, shipBob);
  const ship = art.vehicle('battleship');
  ship.setAttribute('x', 0);
  ship.setAttribute('y', 0);
  ship.setAttribute('width', 420);
  ship.setAttribute('height', 170);
  shipBob.append(ship);
  const parts = [...ship.querySelectorAll('.part')].sort((a, b) => a.dataset.part - b.dataset.part);

  // Front waves hide the hull below the waterline (and the ship as it sinks).
  const front = el('path', { d: 'M-2000 210 H0 Q40 202 80 210 T160 210 T240 210 T320 210 T400 210 T480 210 T560 210 T640 210 H2600 V2300 H-2000 Z', fill: '#2f8fd8' }, svg);
  el('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0; -40 0; 0 0', dur: '6s', repeatCount: 'indefinite' }, front);

  // Player boat + the kid's own character as the captain.
  const boatG = el('g', { transform: 'translate(0 0)' }, svg);
  const boat = art.vehicle('player-boat');
  Object.entries({ x: 0, y: 196, width: 170, height: 102 }).forEach(([k, v]) => boat.setAttribute(k, v));
  const captain = art.character(kid.avatar, kid.color);
  Object.entries({ x: 34, y: 196, width: 56, height: 62 }).forEach(([k, v]) => captain.setAttribute(k, v));
  boatG.append(captain, boat);

  const fx = el('g', {}, svg); // explosions, splashes, cannonballs

  function partCenter(i) {
    const b = parts[i].getBBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }

  async function shootBall(to) {
    sfx.cannon();
    const flash = el('circle', { cx: MUZZLE.x, cy: MUZZLE.y, r: 4, fill: '#ffd23f' }, fx);
    tween(180, (t) => {
      flash.setAttribute('r', 4 + 14 * t);
      flash.setAttribute('opacity', 1 - t);
    }).then(() => flash.remove());
    tween(260, (t) => boatG.setAttribute('transform', `translate(${-8 * Math.sin(Math.PI * t)} 0)`));
    const ball = el('circle', { cx: MUZZLE.x, cy: MUZZLE.y, r: 7, fill: '#2b323b' }, fx);
    const peak = Math.min(MUZZLE.y, to.y) - 90;
    await tween(750, (t) => {
      const x = MUZZLE.x + (to.x - MUZZLE.x) * t;
      // Quadratic arc through the peak.
      const y = (1 - t) * (1 - t) * MUZZLE.y + 2 * (1 - t) * t * peak + t * t * to.y;
      ball.setAttribute('cx', x);
      ball.setAttribute('cy', y);
      ball.setAttribute('r', 7 - 2 * t);
    });
    ball.remove();
  }

  function explosion(x, y) {
    sfx.boom();
    const g = el('g', {}, fx);
    const star = (r1, r2, n = 10) =>
      Array.from({ length: n * 2 }, (_, k) => {
        const r = k % 2 ? r2 : r1;
        const a = (Math.PI * k) / n;
        return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
      }).join(' ');
    const outer = el('polygon', { points: star(40, 18), fill: '#ff7a1a' }, g);
    const inner = el('polygon', { points: star(24, 10), fill: '#ffe066' }, g);
    return tween(650, (t) => {
      const s = 0.3 + easeOut(t) * 1.1;
      g.setAttribute('transform', `translate(${x} ${y}) scale(${s}) rotate(${t * 40})`);
      g.setAttribute('opacity', t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4);
      outer.setAttribute('fill', t > 0.5 ? '#8a8a8a' : '#ff7a1a');
      inner.setAttribute('opacity', 1 - t);
    }).then(() => g.remove());
  }

  /** Darken a hit part and leave fire + smoke on it (attached to the ship so it moves with it). */
  function damage(i) {
    const part = parts[i];
    part.classList.add('hit');
    for (const shape of part.querySelectorAll('path, rect, circle, polygon')) {
      shape.setAttribute('fill', '#3d434b');
      shape.setAttribute('stroke', '#22262b');
    }
    const c = partCenter(i);
    const burn = el('g', {}, ship);
    const flame = el('path', { d: `M${c.x - 8} ${c.y + 4} Q${c.x} ${c.y - 22} ${c.x + 8} ${c.y + 4} Z`, fill: '#ff8a1a' }, burn);
    el('animate', { attributeName: 'opacity', values: '1;0.5;1', dur: '0.4s', repeatCount: 'indefinite' }, flame);
    for (let k = 0; k < 3; k++) {
      const puff = el('circle', { cx: c.x + (k - 1) * 4, cy: c.y - 8, r: 6, fill: '#777', opacity: 0.7 }, burn);
      const d = `${1.6 + k * 0.3}s`;
      el('animate', { attributeName: 'cy', values: `${c.y - 8};${c.y - 46}`, dur: d, begin: `${k * 0.5}s`, repeatCount: 'indefinite' }, puff);
      el('animate', { attributeName: 'r', values: '5;13', dur: d, begin: `${k * 0.5}s`, repeatCount: 'indefinite' }, puff);
      el('animate', { attributeName: 'opacity', values: '0.7;0', dur: d, begin: `${k * 0.5}s`, repeatCount: 'indefinite' }, puff);
    }
  }

  function splash(x, y) {
    sfx.waterSplash();
    const g = el('g', {}, fx);
    const drops = Array.from({ length: 7 }, (_, k) => ({
      e: el('circle', { cx: x, cy: y, r: 5, fill: '#fff' }, g),
      vx: (k - 3) * 9,
      vy: -60 - Math.abs(3 - k) * -6,
    }));
    const col = el('ellipse', { cx: x, cy: y, rx: 10, ry: 4, fill: '#fff', opacity: 0.9 }, g);
    return tween(700, (t) => {
      for (const d of drops) {
        d.e.setAttribute('cx', x + d.vx * t);
        d.e.setAttribute('cy', y + d.vy * t + 110 * t * t);
      }
      col.setAttribute('ry', 4 + 26 * Math.sin(Math.PI * t));
      col.setAttribute('cy', y - 13 * Math.sin(Math.PI * t));
      g.setAttribute('opacity', 1 - easeIn(t));
    }).then(() => g.remove());
  }

  return {
    el: svg,
    /** One shot. hit=true needs the part index to blow up. */
    async fire(hit, part) {
      if (hit) {
        const c = partCenter(part);
        const to = { x: SHIP_X + c.x, y: SHIP_Y + c.y };
        await shootBall(to);
        damage(part);
        await explosion(to.x, to.y);
      } else {
        const to = { x: SHIP_X + 60 + Math.random() * 300, y: 214 };
        await shootBall(to);
        await splash(to.x, to.y);
      }
    },
    /** End of round: sink it, or it sails away smoking. */
    async finale(sunk) {
      if (sunk) {
        sfx.sink();
        const bubbles = el('g', {}, fx);
        for (let k = 0; k < 10; k++) {
          const b = el('circle', { cx: SHIP_X + 60 + k * 32, cy: 214, r: 4, fill: '#fff', opacity: 0.8 }, bubbles);
          el('animate', { attributeName: 'cy', values: '232;206', dur: `${0.6 + (k % 3) * 0.2}s`, repeatCount: 'indefinite' }, b);
        }
        await tween(2600, (t) => {
          const e = easeIn(t);
          shipMove.setAttribute('transform', `translate(${SHIP_X} ${SHIP_Y + e * 175}) rotate(${e * 16} 210 140)`);
        });
        await tween(500, (t) => bubbles.setAttribute('opacity', 1 - t));
        bubbles.remove();
      } else {
        sfx.horn();
        await tween(2800, (t) => {
          const e = easeIn(t);
          shipMove.setAttribute('transform', `translate(${SHIP_X + e * 520} ${SHIP_Y}) rotate(${Math.sin(t * 12) * 2} 210 140)`);
        });
      }
    },
  };
}
