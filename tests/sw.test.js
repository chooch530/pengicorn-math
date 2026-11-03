// Guards against the most likely offline bug: adding a file and forgetting to cache it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

function walk(dir) {
  return readdirSync(join(root, dir)).flatMap((f) => {
    const rel = `${dir}/${f}`;
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
  });
}

test('service worker caches every game file', () => {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const needed = [...walk('js'), ...walk('css'), 'index.html', 'manifest.webmanifest'].filter((f) => !f.endsWith('.svg'));
  for (const f of needed) assert.ok(sw.includes(`'./${f}'`), `sw.js FILES is missing ./${f}`);
});
