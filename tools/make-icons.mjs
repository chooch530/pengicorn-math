// Regenerates the home-screen icons from the in-code SVG art.
// Run: node tools/make-icons.mjs  (needs rsvg-convert installed). Not needed to run the game.
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { penguinSVG } from '../js/art/penguin.js';
import { unicornSVG } from '../js/art/unicorn.js';

const inner = (s) => s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#9fdcff"/>
  <circle cx="420" cy="90" r="46" fill="#ffd23f"/>
  <rect y="360" width="512" height="152" fill="#e8f7ff"/>
  <g transform="translate(40 150) scale(1.15)">${inner(penguinSVG('blue'))}</g>
  <g transform="translate(240 150) scale(1.15)">${inner(unicornSVG('rainbow'))}</g>
</svg>`;
writeFileSync('icons/icon.svg', icon);
for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  execSync(`rsvg-convert -w ${size} -h ${size} icons/icon.svg -o icons/${name}`);
}
console.log('icons written');
