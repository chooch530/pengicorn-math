// Countable objects: fish, snowball, star. Kept simple so 20 of them on screen stay clear.

export function fishSVG() {
  return `
<svg viewBox="0 0 100 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M70 32 L96 12 Q90 32 96 52 Z" fill="#ff8a3d"/>
  <ellipse cx="44" cy="32" rx="36" ry="24" fill="#ffa25a"/>
  <path d="M30 14 Q44 4 58 12" fill="#ff8a3d"/>
  <path d="M38 22 Q46 32 38 42" stroke="#ff8a3d" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="22" cy="28" r="7" fill="#fff"/>
  <circle cx="20" cy="28" r="4" fill="#1d1d2b"/>
  <ellipse cx="52" cy="22" rx="10" ry="4" fill="#fff" opacity="0.35"/>
</svg>`;
}

export function snowballSVG() {
  return `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="32" cy="34" r="27" fill="#eef8ff" stroke="#7fb6e6" stroke-width="3.5"/>
  <path d="M14 42 Q32 58 52 40" stroke="#b4d8f5" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="23" cy="24" r="6" fill="#fff"/>
</svg>`;
}

export function starSVG(fill = '#ffd23f') {
  return `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M32 4 L40 23 L60 24 L44 37 L50 58 L32 46 L14 58 L20 37 L4 24 L24 23 Z"
        fill="${fill}" stroke="#f2a900" stroke-width="3" stroke-linejoin="round"/>
  <path d="M26 22 L32 10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
</svg>`;
}
