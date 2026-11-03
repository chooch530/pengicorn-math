// Original penguin character, drawn as SVG. Returns markup; the registry turns it into an element.
// Parts carry class names (.eyes, .flipper-l, .flipper-r) so CSS can animate them.

export const PENGUIN_VARIANTS = {
  blue: { body: '#2c3e78', belly: '#fffaf0', beak: '#ffa62b', cheek: '#ff9bb3' },
  purple: { body: '#6b4bb8', belly: '#fffaf0', beak: '#ffa62b', cheek: '#ff9bb3' },
  teal: { body: '#1f8a8a', belly: '#fffaf0', beak: '#ffb347', cheek: '#ff9bb3' },
  pink: { body: '#d9559a', belly: '#fff5fa', beak: '#ffa62b', cheek: '#ffd1e0' },
};

export function penguinSVG(variant = 'blue') {
  const c = PENGUIN_VARIANTS[variant] || PENGUIN_VARIANTS.blue;
  return `
<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="100" cy="210" rx="58" ry="8" fill="#000" opacity="0.12"/>
  <ellipse class="foot" cx="76" cy="200" rx="22" ry="10" fill="${c.beak}"/>
  <ellipse class="foot" cx="124" cy="200" rx="22" ry="10" fill="${c.beak}"/>
  <g class="flipper-l"><ellipse cx="38" cy="128" rx="16" ry="40" transform="rotate(20 38 128)" fill="${c.body}"/></g>
  <g class="flipper-r"><ellipse cx="162" cy="128" rx="16" ry="40" transform="rotate(-20 162 128)" fill="${c.body}"/></g>
  <path d="M100 18 C150 18 172 70 172 120 C172 170 145 200 100 200 C55 200 28 170 28 120 C28 70 50 18 100 18 Z" fill="${c.body}"/>
  <path d="M100 58 C136 58 150 95 150 132 C150 170 130 190 100 190 C70 190 50 170 50 132 C50 95 64 58 100 58 Z" fill="${c.belly}"/>
  <path d="M100 40 C124 40 140 56 140 78 C140 96 124 104 100 104 C76 104 60 96 60 78 C60 56 76 40 100 40 Z" fill="${c.belly}"/>
  <ellipse cx="62" cy="96" rx="11" ry="7" fill="${c.cheek}" opacity="0.8"/>
  <ellipse cx="138" cy="96" rx="11" ry="7" fill="${c.cheek}" opacity="0.8"/>
  <g class="eyes">
    <ellipse cx="80" cy="76" rx="11" ry="13" fill="#1d1d2b"/>
    <ellipse cx="120" cy="76" rx="11" ry="13" fill="#1d1d2b"/>
    <circle cx="84" cy="71" r="4.5" fill="#fff"/>
    <circle cx="124" cy="71" r="4.5" fill="#fff"/>
    <circle cx="77" cy="81" r="2" fill="#fff" opacity="0.8"/>
    <circle cx="117" cy="81" r="2" fill="#fff" opacity="0.8"/>
  </g>
  <path d="M88 92 Q100 86 112 92 Q106 106 100 108 Q94 106 88 92 Z" fill="${c.beak}"/>
  <path d="M60 36 Q70 26 82 30" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.25"/>
</svg>`;
}
