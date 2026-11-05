// Original cartoon battleship (side view, no flags or markings of any real navy).
// 10 hittable parts, each <g class="part" data-part="i">: 5 hull sections + front turret,
// bridge, smokestack, rear turret, mast. Waterline at y=140 in a 420x170 box.

const GRAY = '#8d9bab';
const DARK = '#5f6c7b';
const LIGHT = '#b3c0cd';

export function battleshipSVG() {
  const hull = [
    'M20 100 L95 100 L95 140 L52 140 Z', // 0 bow (pointed)
    'M95 100 L170 100 L170 140 L95 140 Z', // 1
    'M170 100 L245 100 L245 140 L170 140 Z', // 2
    'M245 100 L320 100 L320 140 L245 140 Z', // 3
    'M320 100 L402 100 L392 140 L320 140 Z', // 4 stern
  ];
  const hullParts = hull
    .map(
      (d, i) => `<g class="part" data-part="${i}">
        <path d="${d}" fill="${GRAY}" stroke="${DARK}" stroke-width="3" stroke-linejoin="round"/>
        <rect x="${[52, 95, 170, 245, 320][i]}" y="128" width="${[43, 75, 75, 75, 72][i]}" height="12" fill="#d9534f" opacity="0.85"/>
        ${i > 0 && i < 4 ? `<circle cx="${132 + (i - 1) * 75}" cy="114" r="5" fill="${DARK}"/><circle cx="${116 + (i - 1) * 75}" cy="114" r="5" fill="${DARK}"/>` : ''}
      </g>`
    )
    .join('');

  return `
<svg viewBox="0 0 420 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="20" y="96" width="382" height="6" rx="3" fill="${LIGHT}"/>
  ${hullParts}
  <g class="part" data-part="5">
    <rect x="62" y="80" width="56" height="20" rx="8" fill="${GRAY}" stroke="${DARK}" stroke-width="3"/>
    <rect x="22" y="83" width="44" height="6" rx="3" fill="${DARK}"/>
    <rect x="22" y="92" width="44" height="6" rx="3" fill="${DARK}"/>
  </g>
  <g class="part" data-part="6">
    <path d="M140 100 L140 62 Q140 52 150 52 L196 52 Q206 52 206 62 L206 100 Z" fill="${LIGHT}" stroke="${DARK}" stroke-width="3"/>
    <rect x="150" y="62" width="12" height="10" rx="3" fill="#4a90d9"/>
    <rect x="167" y="62" width="12" height="10" rx="3" fill="#4a90d9"/>
    <rect x="184" y="62" width="12" height="10" rx="3" fill="#4a90d9"/>
  </g>
  <g class="part" data-part="7">
    <path d="M222 100 L226 38 L256 38 L260 100 Z" fill="${GRAY}" stroke="${DARK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="224" y="46" width="34" height="8" fill="#f2c94c"/>
  </g>
  <g class="part" data-part="8">
    <rect x="292" y="80" width="56" height="20" rx="8" fill="${GRAY}" stroke="${DARK}" stroke-width="3"/>
    <rect x="344" y="83" width="44" height="6" rx="3" fill="${DARK}"/>
    <rect x="344" y="92" width="44" height="6" rx="3" fill="${DARK}"/>
  </g>
  <g class="part" data-part="9">
    <rect x="171" y="10" width="5" height="44" fill="${DARK}"/>
    <path d="M176 12 L204 19 L176 27 Z" fill="#ff7a59"/>
    <rect x="160" y="22" width="27" height="4" rx="2" fill="${DARK}"/>
  </g>
</svg>`;
}

/** Small tugboat with a cannon, for the player. The kid's character stands on deck (added by the scene). */
export function playerBoatSVG() {
  return `
<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="cannon">
    <rect x="118" y="38" width="62" height="18" rx="9" fill="#3d4652" transform="rotate(-28 125 60)"/>
    <circle cx="128" cy="62" r="14" fill="#2b323b"/>
  </g>
  <path d="M8 66 L192 66 L172 108 Q100 118 28 108 Z" fill="#ff8a3d" stroke="#c4561a" stroke-width="4" stroke-linejoin="round"/>
  <rect x="8" y="62" width="184" height="8" rx="4" fill="#fff"/>
  <circle cx="60" cy="86" r="7" fill="#fff" stroke="#c4561a" stroke-width="3"/>
  <circle cx="90" cy="86" r="7" fill="#fff" stroke="#c4561a" stroke-width="3"/>
</svg>`;
}

/**
 * Original cartoon pirate ship for the Words battleship (side view, same 420x170 box and
 * waterline as the battleship so the scene code works for both). 10 hittable parts:
 * 5 hull sections, bowsprit + jib, fore mast, main mast, mizzen mast, flag.
 */
export function pirateShipSVG() {
  const WOOD = '#9c6236';
  const WOOD_D = '#6b3f1f';
  const SAIL = '#fff6e0';
  const hull = [
    'M28 100 L95 100 L95 140 L60 140 Z', // 0 bow
    'M95 100 L170 100 L170 140 L95 140 Z',
    'M170 100 L245 100 L245 140 L170 140 Z',
    'M245 100 L320 100 L320 140 L245 140 Z',
    'M320 78 L398 78 L388 140 L320 140 Z', // 4 raised stern
  ];
  const hullParts = hull
    .map(
      (d, i) => `<g class="part" data-part="${i}">
        <path d="${d}" fill="${WOOD}" stroke="${WOOD_D}" stroke-width="3" stroke-linejoin="round"/>
        <rect x="${[60, 95, 170, 245, 320][i]}" y="${i === 4 ? 98 : 112}" width="${[35, 75, 75, 75, 70][i]}" height="5" fill="#f2c94c"/>
        ${i > 0 && i < 4 ? `<rect x="${118 + (i - 1) * 75}" y="122" width="12" height="10" rx="2" fill="#2b1a0d"/><rect x="${140 + (i - 1) * 75}" y="122" width="12" height="10" rx="2" fill="#2b1a0d"/>` : ''}
        ${i === 4 ? '<rect x="340" y="84" width="12" height="10" rx="2" fill="#ffd56b"/><rect x="360" y="84" width="12" height="10" rx="2" fill="#ffd56b"/>' : ''}
      </g>`
    )
    .join('');
  const mast = (i, x, top, w, stripes) => `<g class="part" data-part="${i}">
      <rect x="${x - 3}" y="${top}" width="6" height="${100 - top}" fill="${WOOD_D}"/>
      <path d="M${x - w / 2} ${top + 10} Q${x} ${top + 4} ${x + w / 2} ${top + 10} L${x + w / 2 - 4} ${top + 58} Q${x} ${top + 66} ${x - w / 2 + 4} ${top + 58} Z" fill="${SAIL}" stroke="#d9c49a" stroke-width="2"/>
      ${stripes ? `<rect x="${x - w / 2 + 3}" y="${top + 28}" width="${w - 6}" height="8" fill="#d9534f"/>` : ''}
    </g>`;
  return `
<svg viewBox="0 0 420 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  ${hullParts}
  <g class="part" data-part="5">
    <path d="M30 100 L2 84" stroke="${WOOD_D}" stroke-width="5" stroke-linecap="round"/>
    <path d="M6 84 L80 40 L84 96 Z" fill="${SAIL}" stroke="#d9c49a" stroke-width="2"/>
  </g>
  ${mast(6, 130, 36, 64, false)}
  ${mast(7, 215, 14, 84, true)}
  ${mast(8, 300, 30, 60, false)}
  <g class="part" data-part="9">
    <rect x="213" y="2" width="4" height="14" fill="${WOOD_D}"/>
    <rect x="217" y="2" width="34" height="22" rx="2" fill="#22252a"/>
    <circle cx="234" cy="11" r="6" fill="#fff"/>
    <circle cx="232" cy="10" r="1.6" fill="#22252a"/><circle cx="236.5" cy="10" r="1.6" fill="#22252a"/>
    <path d="M226 19 L242 15 M226 15 L242 19" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`;
}
