// Turns a single-file exhibit written as a Claude artifact (a page fragment with no
// <!doctype>, <head> or <body>) into a complete page inside the museum, with the
// museum's top bar attached.
//
//   node tools/import.mjs <path/to/exhibit.html> <slug>
//
// It writes exhibits/<slug>/index.html. Add the exhibit to exhibits.json too, then run
// node tools/check.mjs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [src, slug] = process.argv.slice(2);
if (!src || !slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('usage: node tools/import.mjs <exhibit.html> <slug>   (slug: lowercase letters, digits and dashes)');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let s = readFileSync(src, 'utf8').replace(/^﻿/, '');
if (/<!doctype/i.test(s)) {
  console.error(`${src} is already a complete page. Copy it to exhibits/${slug}/index.html and add the museum lines by hand.`);
  process.exit(1);
}
s = s.replace(/<meta charset="utf-8">\s*/i, '');

// Everything up to the end of the first <style> block belongs in <head>.
const cut = s.indexOf('</style>');
if (cut < 0) {
  console.error('Expected a <style> block near the top of the exhibit.');
  process.exit(1);
}
const head = s.slice(0, cut + '</style>'.length).trim();
const body = s.slice(cut + '</style>'.length).trim();

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
${head}
<link rel="stylesheet" href="../../shared/museum.css">
<script src="../../shared/museum.js" data-exhibit="${slug}" defer></script>
</head>
<body>
${body}
</body>
</html>
`;

const out = join(root, 'exhibits', slug);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), page);
console.log(`Wrote exhibits/${slug}/index.html`);
