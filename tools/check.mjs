// Checks that the museum hangs together. Run before every commit (CI runs it too):
//
//   node tools/check.mjs
//
// - every hall and exhibit in exhibits.json has the fields it needs
// - every open exhibit has exhibits/<slug>/index.html, a complete page that loads the
//   museum bar with its own slug
// - every exhibit folder is listed (except _template)
// - relative links and file references inside the pages point at files that exist
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = (msg) => problems.push(msg);

let data;
try {
  data = JSON.parse(readFileSync(join(root, 'exhibits.json'), 'utf8'));
} catch (err) {
  console.error(`exhibits.json does not parse: ${err.message}`);
  process.exit(1);
}

const halls = new Set();
for (const h of data.halls || []) {
  for (const f of ['id', 'name', 'color', 'blurb']) if (!h[f]) fail(`hall ${h.id || '?'} is missing "${f}"`);
  if (halls.has(h.id)) fail(`hall id "${h.id}" is used twice`);
  halls.add(h.id);
}

const slugs = new Set();
for (const e of data.exhibits || []) {
  const where = `exhibit "${e.slug || e.title || '?'}"`;
  for (const f of ['slug', 'hall', 'title', 'blurb']) if (!e[f]) fail(`${where} is missing "${f}"`);
  if (e.slug && !/^[a-z0-9-]+$/.test(e.slug)) fail(`${where}: slugs use lowercase letters, digits and dashes`);
  if (slugs.has(e.slug)) fail(`${where} is listed twice`);
  slugs.add(e.slug);
  if (e.hall && !halls.has(e.hall)) fail(`${where} names hall "${e.hall}", which does not exist`);
  if (e.status === 'planned') continue;
  const file = join(root, 'exhibits', e.slug, 'index.html');
  if (!existsSync(file)) { fail(`${where} has no exhibits/${e.slug}/index.html`); continue; }
  const html = readFileSync(file, 'utf8');
  if (!/^\s*<!doctype html>/i.test(html)) fail(`${where}: index.html must start with <!doctype html>`);
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(`${where}: index.html has no <title>`);
  if (!/<meta name="viewport"/i.test(html)) fail(`${where}: index.html has no viewport meta tag`);
  const bar = html.match(/<script[^>]*src="\.\.\/\.\.\/shared\/museum\.js"[^>]*>/i);
  if (!bar) fail(`${where}: index.html does not load ../../shared/museum.js`);
  else if (!new RegExp(`data-exhibit="${e.slug}"`).test(bar[0])) fail(`${where}: museum.js is loaded with the wrong data-exhibit`);
}

for (const name of readdirSync(join(root, 'exhibits'))) {
  if (name.startsWith('_') || !statSync(join(root, 'exhibits', name)).isDirectory()) continue;
  if (!slugs.has(name)) fail(`exhibits/${name}/ is not listed in exhibits.json`);
}

// Relative href/src references must point at real files.
function pages(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...pages(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}
for (const page of pages(root)) {
  const html = readFileSync(page, 'utf8');
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = m[1];
    // Skip external links, in-page anchors, data URIs and links built inside scripts.
    if (/^(?:[a-z]+:|\/\/|#|data:)/i.test(ref) || ref.includes('${')) continue;
    const target = resolve(dirname(page), ref.split(/[?#]/)[0]);
    const ok = existsSync(target) && (!statSync(target).isDirectory() || existsSync(join(target, 'index.html')));
    if (!ok) fail(`${relative(root, page)} links to "${ref}", which does not exist`);
  }
}

if (problems.length) {
  console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
const open = data.exhibits.filter((e) => e.status !== 'planned').length;
console.log(`OK: ${data.halls.length} halls, ${open} open exhibits, ${data.exhibits.length - open} planned.`);
