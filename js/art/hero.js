// Heroes world art (all original): a caped kid superhero, a super-unicorn (the unicorn
// plus a cape and mask), the trapped "buddy" friends, and two small countable objects.
import { unicornSVG, UNICORN_VARIANTS } from './unicorn.js';

export const HERO_VARIANTS = {
  red: { suit: '#e63946', cape: '#ffd23f', mask: '#1d3557', boot: '#1d3557' },
  blue: { suit: '#2f7fe0', cape: '#e63946', mask: '#16325c', boot: '#16325c' },
  green: { suit: '#2a9d8f', cape: '#ff9f1c', mask: '#1b4d47', boot: '#1b4d47' },
  purple: { suit: '#7b4fd6', cape: '#ff6fae', mask: '#3a2470', boot: '#3a2470' },
};

export function heroSVG(variant = 'red') {
  const c = HERO_VARIANTS[variant] || HERO_VARIANTS.red;
  const skin = '#ffd7b5';
  return `
<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="100" cy="212" rx="56" ry="7" fill="#000" opacity="0.12"/>
  <path class="cape" d="M62 112 Q40 170 34 204 Q100 192 166 204 Q160 170 138 112 Z" fill="${c.cape}"/>
  <rect x="72" y="176" width="22" height="30" rx="9" fill="${c.boot}"/>
  <rect x="106" y="176" width="22" height="30" rx="9" fill="${c.boot}"/>
  <path d="M66 118 Q100 104 134 118 L130 184 Q100 192 70 184 Z" fill="${c.suit}"/>
  <rect x="70" y="166" width="60" height="9" rx="4" fill="#ffd23f"/>
  <path d="M100 130 L106 143 L120 144 L109 153 L113 167 L100 159 L87 167 L91 153 L80 144 L94 143 Z" fill="#ffd23f" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
  <g class="arm-l"><path d="M68 122 Q44 132 40 104" stroke="${c.suit}" stroke-width="18" stroke-linecap="round" fill="none"/><circle cx="40" cy="100" r="11" fill="${skin}"/></g>
  <g class="arm-r"><path d="M132 122 Q154 140 156 160" stroke="${c.suit}" stroke-width="18" stroke-linecap="round" fill="none"/><circle cx="156" cy="162" r="11" fill="${skin}"/></g>
  <circle cx="100" cy="66" r="48" fill="${skin}"/>
  <path d="M52 62 Q54 18 100 16 Q148 18 150 62 Q138 40 118 38 Q122 30 112 26 Q104 40 84 40 Q62 42 52 62 Z" fill="#5a3825"/>
  <path d="M56 66 Q100 52 144 66 Q146 84 132 86 Q116 88 100 78 Q84 88 68 86 Q54 84 56 66 Z" fill="${c.mask}"/>
  <g class="eyes">
    <ellipse cx="80" cy="70" rx="8" ry="9" fill="#fff"/>
    <ellipse cx="120" cy="70" rx="8" ry="9" fill="#fff"/>
    <circle cx="81" cy="71" r="5" fill="#1d1d2b"/>
    <circle cx="121" cy="71" r="5" fill="#1d1d2b"/>
    <circle cx="83" cy="68" r="2" fill="#fff"/>
    <circle cx="123" cy="68" r="2" fill="#fff"/>
  </g>
  <ellipse cx="66" cy="94" rx="9" ry="6" fill="#ff9bb3" opacity="0.7"/>
  <ellipse cx="134" cy="94" rx="9" ry="6" fill="#ff9bb3" opacity="0.7"/>
  <path d="M86 96 Q100 108 114 96" stroke="#9c4a3a" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>`;
}

// Super-unicorn: the regular unicorn plus a cape (behind) and an eye mask (over the face).
const UNICORN_CAPE = {
  rainbow: '#e63946',
  pink: '#7b4fd6',
  purple: '#ffd23f',
  blue: '#ff9f1c',
};

export function superUnicornSVG(variant = 'rainbow') {
  const v = UNICORN_VARIANTS[variant] ? variant : 'rainbow';
  const cape = UNICORN_CAPE[v];
  const capeMarkup = `<path class="cape" d="M58 150 Q30 190 22 214 Q100 200 178 214 Q170 190 142 150 Z" fill="${cape}"/>`;
  const maskMarkup = `<path d="M50 92 Q100 74 150 92 Q152 112 134 114 Q116 116 100 104 Q84 116 66 114 Q48 112 50 92 Z" fill="${cape}" opacity="0.95"/>`;
  return unicornSVG(v)
    .replace('<path class="tail"', `${capeMarkup}\n  <path class="tail"`)
    .replace('<g class="eyes">', `${maskMarkup}\n  <g class="eyes">`);
}

/** Which colors a kid's team character wears (from the color they picked for their player). */
export function teamCharacter(kid) {
  const team = kid?.prefs?.team === 'unicorn' ? 'unicorn' : 'hero';
  if (team === 'unicorn') {
    const map = { blue: 'blue', purple: 'purple', pink: 'pink', rainbow: 'rainbow', teal: 'blue' };
    return { kind: 'super-unicorn', variant: map[kid?.color] || 'rainbow', team };
  }
  const map = { blue: 'blue', purple: 'purple', teal: 'green', pink: 'purple', rainbow: 'red' };
  return { kind: 'hero', variant: map[kid?.color] || 'red', team };
}

// The friends trapped in bubbles: round fluffy critters in different colors.
export const BUDDY_COLORS = ['#ff8fab', '#7ed957', '#ffb347', '#5bc0ff', '#b07cff'];

export function buddySVG(i = 0) {
  const c = BUDDY_COLORS[i % BUDDY_COLORS.length];
  return `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M14 22 L12 6 L26 16 Z M50 22 L52 6 L38 16 Z" fill="${c}"/>
  <circle cx="32" cy="36" r="24" fill="${c}"/>
  <ellipse cx="32" cy="44" rx="13" ry="10" fill="#fff" opacity="0.55"/>
  <circle cx="24" cy="32" r="4" fill="#1d1d2b"/>
  <circle cx="40" cy="32" r="4" fill="#1d1d2b"/>
  <circle cx="25.5" cy="30.5" r="1.5" fill="#fff"/>
  <circle cx="41.5" cy="30.5" r="1.5" fill="#fff"/>
  <path d="M27 42 Q32 47 37 42" stroke="#1d1d2b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <ellipse cx="17" cy="40" rx="4" ry="2.5" fill="#ff5c8a" opacity="0.5"/>
  <ellipse cx="47" cy="40" rx="4" ry="2.5" fill="#ff5c8a" opacity="0.5"/>
</svg>`;
}

export function heartSVG() {
  return `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M32 56 C10 40 4 28 8 18 C12 8 26 6 32 18 C38 6 52 8 56 18 C60 28 54 40 32 56 Z" fill="#ff5c8a" stroke="#d63a6a" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="20" cy="22" rx="5" ry="3.5" fill="#fff" opacity="0.6"/>
</svg>`;
}
