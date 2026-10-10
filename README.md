# The Museum of Working Things

Instruments, machines and mysteries you can operate. Every exhibit works, and every
one has a true story behind it.

It is a plain static website: HTML files, one list, and no build step. GitHub Pages
serves it, and any web server can.

## What's inside

```
index.html              the lobby: halls and exhibit cards, drawn from exhibits.json
exhibits.json           the only list you edit: the museum's name, its halls, its exhibits
shared/museum.css       the top bar every exhibit shows (Lobby · Hall · Next exhibit)
shared/museum.js        draws that bar and stamps the visitor's passport
exhibits/<slug>/        one folder per exhibit, holding a single index.html
exhibits/_template/     a starting point for a new exhibit
tools/import.mjs        turns an exhibit built as a Claude artifact into a museum page
tools/check.mjs         checks the list, the folders and the links agree
.github/workflows/      runs the check and publishes to GitHub Pages
```

## Halls

| Hall | Exhibits |
| --- | --- |
| Sky & Time | Brass Astrolabe, Eratosthenes' Shadow, Harrison's Sea Watch, Foucault's Pendulum |
| Music & Sound | Carousel Band Organ, Thirty-Note Music Box, Autoharp Chords |
| Life Science | Litter Lab, Broad Street Pump, Darwin's Finches |
| Making & Mending | Kintsugi Bowl, Ebru Tray, Letterpress Type Case |
| Machines & Messages | Lock and Dam No. 1, Enigma Machine, Telegraph Office, Jacquard Loom, Difference Engine, Split Rock Lighthouse |
| Numbers & Elements | Mendeleev's Table, Slide Rule, Napier's Bones, Galileo's Ramp |

## Adding an exhibit

1. Build the exhibit as one self-contained HTML file: its own CSS and JavaScript
   inline, fonts from Google Fonts, no other outside files.
2. Bring it into the museum:
   - built as a Claude artifact (a page fragment with no `<!doctype>`):
     `node tools/import.mjs path/to/exhibit.html <slug>`
   - written from scratch: copy `exhibits/_template/` to `exhibits/<slug>/` and set
     `data-exhibit="<slug>"` on the `museum.js` script tag.
3. Add an entry to `exhibits.json` with its `slug`, `hall`, `title`, `blurb`, and
   optionally `ages` and `try`. An entry with `"status": "planned"` shows in the
   lobby as "Opening soon" and needs no folder yet.
4. Run `node tools/check.mjs`, preview locally, commit.

## House rules

These keep the museum easy to grow.

- **Every exhibit stands alone.** It can link out, but it never loads code or files
  from another exhibit. The only shared pieces are `shared/museum.css` and
  `shared/museum.js`, and an exhibit still works if those fail to load.
- **A real object you operate,** not a slideshow about one. It opens in a working
  state, not an empty one.
- **True facts with sources.** Every exhibit ends with links to where its history
  came from.
- **Light on the computer.** An exhibit sits idle until a visitor touches it, and
  stops animating when nothing moves.
- **Both light and dark themes,** phone widths, keyboard access, and respect for
  reduced motion.

## Running it locally

`exhibits.json` is loaded with `fetch`, so open the museum through a small web server
rather than straight from disk. Either of these works from this folder:

```
python -m http.server 8080
docker run --rm -p 8080:80 -v "${PWD}:/usr/share/nginx/html:ro" nginx:alpine
```

Then visit http://localhost:8080.

## Publishing

Pushing to `main` runs `tools/check.mjs` and, if it passes, publishes the site with
GitHub Pages (the repository's Pages source must be set to **GitHub Actions**).
Pull requests run the check only.
