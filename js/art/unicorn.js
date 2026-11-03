// Original chibi unicorn character, front-facing, drawn as SVG.
// Variants change the mane colors. Parts carry class names for CSS animation.

export const UNICORN_VARIANTS = {
  rainbow: { mane: ['#ff6b9d', '#ffb347', '#7ed957', '#5bc0ff', '#b07cff'] },
  pink: { mane: ['#ff6fae', '#ff9cc8', '#ff6fae', '#ffc2dd', '#ff86bb'] },
  purple: { mane: ['#8a5cf6', '#b28dff', '#8a5cf6', '#d4c2ff', '#a079ff'] },
  blue: { mane: ['#3aa0ff', '#7cc4ff', '#3aa0ff', '#bfe3ff', '#5ab2ff'] },
};

export function unicornSVG(variant = 'rainbow') {
  const m = (UNICORN_VARIANTS[variant] || UNICORN_VARIANTS.rainbow).mane;
  const body = '#fffafc';
  const line = '#e6d6ef';
  return `
<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="100" cy="210" rx="58" ry="8" fill="#000" opacity="0.12"/>
  <path class="tail" d="M150 170 C185 160 190 130 175 118 C185 140 165 155 150 152 Z" fill="${m[4]}"/>
  <path d="M155 168 C178 166 186 150 182 136 C178 152 166 158 152 158 Z" fill="${m[1]}"/>
  <ellipse cx="100" cy="172" rx="52" ry="34" fill="${body}" stroke="${line}" stroke-width="3"/>
  <rect x="70" y="170" width="22" height="38" rx="11" fill="${body}" stroke="${line}" stroke-width="3"/>
  <rect x="108" y="170" width="22" height="38" rx="11" fill="${body}" stroke="${line}" stroke-width="3"/>
  <rect x="70" y="196" width="22" height="12" rx="6" fill="#c9b6e4"/>
  <rect x="108" y="196" width="22" height="12" rx="6" fill="#c9b6e4"/>
  <path d="M58 52 L48 18 L80 40 Z" fill="${body}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M142 52 L152 18 L120 40 Z" fill="${body}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M60 46 L54 28 L70 40 Z" fill="#ffc2dd"/>
  <path d="M140 46 L146 28 L130 40 Z" fill="#ffc2dd"/>
  <circle cx="100" cy="98" r="62" fill="${body}" stroke="${line}" stroke-width="3"/>
  <g class="horn">
    <path d="M88 44 L100 2 L112 44 Z" fill="#ffd54f" stroke="#f2b705" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M92 32 L108 26 M95 20 L106 16" stroke="#f2b705" stroke-width="3" stroke-linecap="round"/>
  </g>
  <path d="M60 60 C64 34 92 26 104 40 C96 44 90 52 88 62 C80 54 70 54 60 60 Z" fill="${m[0]}"/>
  <path d="M104 40 C122 30 146 42 142 66 C132 58 120 56 112 60 C112 52 110 46 104 40 Z" fill="${m[2]}"/>
  <path d="M142 66 C154 76 156 96 150 112 C146 98 140 90 132 86 C138 80 142 74 142 66 Z" fill="${m[3]}"/>
  <path d="M84 58 C88 46 98 42 106 46 C100 50 98 58 98 66 C94 62 90 60 84 58 Z" fill="${m[1]}"/>
  <ellipse cx="100" cy="128" rx="34" ry="22" fill="#ffe3ef"/>
  <ellipse cx="90" cy="128" rx="4" ry="5" fill="#e69bbd"/>
  <ellipse cx="110" cy="128" rx="4" ry="5" fill="#e69bbd"/>
  <ellipse cx="58" cy="112" rx="10" ry="7" fill="#ff9bb3" opacity="0.7"/>
  <ellipse cx="142" cy="112" rx="10" ry="7" fill="#ff9bb3" opacity="0.7"/>
  <g class="eyes">
    <ellipse cx="76" cy="96" rx="10" ry="12" fill="#2b1d3b"/>
    <ellipse cx="124" cy="96" rx="10" ry="12" fill="#2b1d3b"/>
    <circle cx="80" cy="91" r="4" fill="#fff"/>
    <circle cx="128" cy="91" r="4" fill="#fff"/>
    <circle cx="73" cy="100" r="2" fill="#fff" opacity="0.8"/>
    <circle cx="121" cy="100" r="2" fill="#fff" opacity="0.8"/>
  </g>
  <path d="M92 140 Q100 146 108 140" stroke="#c77fa3" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>`;
}
