// Adds the museum's top bar to an exhibit and stamps the visitor's passport.
// Include it from an exhibit with:
//   <script src="../../shared/museum.js" data-exhibit="your-slug" defer></script>
(() => {
  'use strict';
  const me = document.currentScript;
  if (!me) return;
  const slug = me.dataset.exhibit;
  const root = new URL('../', me.src);
  const KEY = 'museum-passport-v1';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function stamp() {
    try {
      const seen = new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
      seen.add(slug);
      localStorage.setItem(KEY, JSON.stringify([...seen]));
      return seen;
    } catch (err) {
      return new Set([slug]);
    }
  }

  fetch(new URL('exhibits.json', root))
    .then((r) => r.json())
    .then((data) => {
      // walk the exhibits in the same order as the lobby: hall by hall
      const halls = data.halls.map((h) => h.id);
      const open = data.exhibits.filter((e) => e.status !== 'planned')
        .sort((a, b) => halls.indexOf(a.hall) - halls.indexOf(b.hall));
      const i = open.findIndex((e) => e.slug === slug);
      if (i < 0) return;
      const ex = open[i];
      const hall = data.halls.find((h) => h.id === ex.hall) || { name: '', color: 'currentColor' };
      const prev = open[(i - 1 + open.length) % open.length];
      const next = open[(i + 1) % open.length];
      const seen = stamp();
      const visited = open.filter((e) => seen.has(e.slug)).length;
      const href = (s) => new URL(`exhibits/${s}/`, root).href;
      const bar = document.createElement('nav');
      bar.className = 'mu-bar';
      bar.setAttribute('aria-label', 'Museum');
      bar.innerHTML = `
        <a class="mu-home" href="${new URL('./', root).href}">${esc(data.museum.name)}</a>
        <span class="mu-hall" style="--mu-hall:${esc(hall.color)}">${esc(hall.name)}</span>
        <span class="mu-space"></span>
        <span class="mu-pass" title="Exhibits you have visited in this browser">Passport: ${visited} of ${open.length}</span>
        <a class="mu-step" href="${href(prev.slug)}" aria-label="Previous exhibit: ${esc(prev.title)}">←</a>
        <a class="mu-step" href="${href(next.slug)}" aria-label="Next exhibit: ${esc(next.title)}"><span class="mu-step-title">Next: ${esc(next.title)} </span>→</a>`;
      document.body.prepend(bar);
    })
    .catch(() => { /* The exhibit still works on its own. */ });
})();
