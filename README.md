# The Little Orange Book

*Quotations from Pauline Hanson* — a page-turning pocket booklet for the web, plus a print
edition that comes off the printer at 105 × 148 mm.

Next.js 16 (App Router, TypeScript), zero runtime dependencies beyond React. The whole page
prerenders as static HTML and hydrates into a client-side reader, so it deploys to Vercel with
no configuration.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build + type check
npm start        # serve the production build
```

## Deploying to Vercel

Zero-config. Either:

```bash
npx vercel        # preview
npx vercel --prod # production
```

or push the repo and import it at [vercel.com/new](https://vercel.com/new). Vercel detects
Next.js, runs `next build`, and serves `/` from the edge cache. No database — the voting record is
a committed snapshot. The one variable to set is `SITE_PASSWORD`, below.

## The password gate

The booklet is unlaunched, so it sits behind one shared password — the same mechanism and the same
`SITE_PASSWORD` as the No Room for Racism site, so one password covers both.

```bash
echo 'SITE_PASSWORD=<the shared password>' >> .env.local   # git-ignored
```

and set the same variable in the Vercel project. **This repository is public: the password must
never be committed.** `.env.example` ships it empty on purpose.

**The gate is opt-in.** `SITE_PASSWORD` set turns it on; unset means the site is public, which is
how it ships at launch — you open the booklet by deleting one environment variable, not by editing
code. The trade-off is real: a typo in the variable name on Vercel leaves the site readable rather
than shut. It is accepted because failing closed would take the *public* campaign site down at
exactly the moment it matters most.

How it works:

- `middleware.ts` runs in front of every request, rewrites anything unauthenticated onto `/enter`,
  and answers `/api/*` with a 401 JSON body rather than a page a `fetch` would choke on. A rewrite,
  not a redirect — the address bar keeps the URL asked for, so signing in and reloading lands you
  where you were going, and there is no `?next=` parameter to validate and therefore no
  open-redirect surface.
- The session cookie is signed with a key derived from `SITE_PASSWORD` itself, so there is no
  second secret to manage and rotating the password invalidates every live session for free. The
  cookie carries an HMAC over an expiry and a nonce — never the password.
- The password compare is constant-time over SHA-256 digests, so neither the timing nor the loop
  count leaks the password's content or its length.
- `/enter` overrides `openGraph` and `twitter`, not just `title`. The root layout's social metadata
  names the subject of the booklet and Next inherits it into every route, which would have put
  "Quotations from Pauline Hanson" into the one page a stranger is allowed to read — and into the
  link preview of anyone who shared the gate.

Middleware means requests are no longer purely static edge cache hits. With `SITE_PASSWORD` unset
the work is one environment read and a pass-through, and `middleware.ts` can be deleted outright
once the gate is retired.

### Custom domain: littleorangebook.com.au

Not wired up yet — it needs a registrar account and DNS access, so it is on you to run.

1. **Register the name.** `.com.au` is restricted: the registrant needs an Australian presence —
   an ABN, ACN, or an Australian trade mark — and, under the current auDA rules, the domain must
   match or relate to that entity's name or its goods and services. Register it against the
   campaign's own ABN (VTHC or whoever is authorising), not a personal one.
2. **Attach it to the project.**

   ```bash
   npx vercel domains add littleorangebook.com.au
   npx vercel domains add www.littleorangebook.com.au
   ```

   or Project → Settings → Domains in the dashboard. Set one as primary and let Vercel 308 the
   other to it; apex-as-primary reads better on a printed QR code.
3. **Point DNS at Vercel.** Either delegate the whole zone to `ns1.vercel-dns.com` /
   `ns2.vercel-dns.com`, or keep your registrar's DNS and add:

   | Record | Name  | Value                  |
   | ------ | ----- | ---------------------- |
   | A      | `@`   | `76.76.21.21`          |
   | CNAME  | `www` | `cname.vercel-dns.com` |

   Vercel shows the current values on the Domains screen — use those if they differ. TLS is
   issued automatically once the records resolve; allow up to an hour for propagation.
4. **Then update the artwork.** The back cover's QR code is still a placeholder box, and
   `campaignUrl` in `lib/config.ts` still points at the Megaphone petition. Once the domain
   resolves, decide which of the two the printed QR should carry and set it there.

## How it is put together

```
app/
  layout.tsx           Fonts (Caprasimo + Figtree via next/font), metadata, viewport
  globals.css          Organic design tokens, page-turn keyframes, print rules
  page.tsx             Composes the reader and the print edition
components/
  Book.tsx             The reader: state, page-turn physics, layout maths  (client)
  BookPage.tsx         One leaf — cover, chapter, quote, contents, table, back  (server)
  CoverPortrait.tsx    Cover still, then the morph over the top  (client)
  PrintBook.tsx        The paper edition, hidden on screen  (server)
lib/
  content.ts           Chapters, quotations, voting record; builds the 93-page sequence
  config.ts            Cover colour, campaign details, disclaimer
public/
  hanson-portrait.webp Cover still, transparent ground
  hanson-morph.webm    Hanson → Trump → pig morph, 15.2 s loop, alpha channel
  hanson-morph.mp4     H.264 fallback — no alpha, so this one has the orange baked in
```

### The cover morph

The cover sits still, under the design's own treatment — greyscale, hard contrast, multiplied into
the cover so the ink reads as part of the stock. **Double-click it** (or press Enter on it) and the
morph loads and plays in colour. Nothing is fetched until asked for: the morph is over a megabyte
and most readers will never call for it.

That treatment could not be used while the media carried its own orange ground — greyscale and
contrast cannot separate a ground from skin that sits near it in value, so pushing one to white
took the other with it. With the ground keyed out there is nothing to separate: the filter only
touches the figure, and multiply lets the cover's own orange through everywhere else.

The gesture is deliberate, which is why reduced-motion does not suppress it — that setting governs
motion nobody asked for.

**Nothing carries an orange of its own.** The ground is keyed out of every asset, so what shows
behind the figures is the cover's own background. That is the only way to guarantee a single
orange: a baked-in colour has to survive next/image's lossy re-encode *and* the browser's video
colour pipeline, and on a colour-managed display those two land a few levels apart from CSS and
from each other. Keying sidesteps the whole question — there is one orange because there is only
one thing painting orange. For the same reason the still is served `unoptimized`.

The hand-over is a **cut, not a fade**. Both layers are transparent, so the still would show
through the morph wherever the figure is narrower than Hanson — her hair around the pig's head —
and cross-fading two transparent layers lets the ground through both at once. The video is held
at frame one until it can play, and frame one is what the still shows, so the cut lands on
identical pixels. `canplaythrough` fires again on re-buffer and on every loop, so the hand-over
is guarded by a ref; without it each fire would rewind the morph.

The source GIFs under `output/imagegen/` are 129 MB and 64 MB, which is not something you serve.
`public/` holds re-encodes at 440 × 544:

```bash
SRC=output/imagegen/morph-sequence-v2/pauline-trump-pig-morph-ultra-smooth.gif
KEYED="fps=25,colorkey=0xE9350C:0.10:0.05,format=rgba,scale=440:-2:flags=lanczos"

# WebM carries a real alpha channel. ffprobe reports the base layer as yuv420p
# either way — check the container's alpha_mode tag, not the pix_fmt.
ffmpeg -i "$SRC" -an -vf "$KEYED,format=yuva420p" -c:v libvpx-vp9 -pix_fmt yuva420p \
  -crf 34 -b:v 0 -row-mt 1 -cpu-used 2 -auto-alt-ref 0 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 public/hanson-morph.webm

ffmpeg -i "$SRC" -frames:v 1 -vf "$KEYED" -update 1 /tmp/still.png
cwebp -q 90 -alpha_q 100 -exact /tmp/still.png -o public/hanson-portrait.webp
```

`format=rgba` before `scale` matters — without it lanczos drops the alpha. Similarity is 0.10
deliberately: at 0.18 the key starts eating Hanson's auburn hair, at 0.26 it destroys the face.

The MP4 is the only asset that still bakes the orange in, because H.264 cannot carry alpha. It is
a fallback for browsers without VP9-alpha; Chrome and Firefox take the WebM. If you change
`coverColor`, re-encode it by compositing the keyed frames over the new colour.

`BookPage` is a pure function of a `PageView` — a page flattened into everything a leaf needs to
draw itself. `Book` builds four of them per frame: the two flat halves of the spread, and the
front and back faces of the leaf in flight.

### The page turn

The book lives in a fixed 380 × 570 coordinate space and is scaled to fit the viewport, so every
offset in `Book.tsx` is in page units rather than pixels.

A turn runs one of three ways:

- **Keyboard or button** — a CSS keyframe animation, committed by a timer. Consecutive turns
  within 700 ms shorten the duration progressively (780 ms down to 150 ms), so holding the arrow
  key riffles rather than crawls. Each turn alternates between two identically-defined keyframes
  (`leafFwd` / `leafFwdB`) so a turn fired mid-flight restarts instead of being ignored.
- **Drag** — the leaf's `rotateY` is driven straight off pointer movement, with the shading,
  the cast shadow and the gutter all recomputed per frame.
- **Release** — past 28 % it commits, short of that it springs back, each on its own transition.

Reader state is held in a ref and renders are forced manually. The pointer handlers and the
commit timer all read the very latest values mid-gesture, which a batched `useState` snapshot
cannot promise.

### Lighting

Both faces of the turning leaf carry the same specular highlight as the flat page each one lands
as — the front matches the right page's, the back matches the left's — and the brightness follows
`|cos|` of the rotation, so a face lit head-on dies away as it turns edge-on and the other one
arrives. Their edge shading is not defined separately: the front reuses the right page's gradient
and the back reuses `.leftShade`, which keeps them matched by construction. The result is that
committing a turn changes nothing about the lighting; there is no step at either end.

Every leaf also carries a paper grain — fractal noise multiplied over the finished page, so it
darkens into the stock rather than hazing over it. Screen only; the print edition comes out on
real paper.

### Pagination

Blank leaves fall where a bound book puts them: the inside of the front cover, a verso facing
chapter one, and two closing the end matter. The one facing chapter one is load-bearing —
chapters run exactly four pages each, so that single blank is what keeps every chapter opener on
a right-hand page. Single-page mode steps straight over blanks rather than showing an empty
screen.

Both covers stand alone: nothing faces the front cover, and nothing faces the back one either.
The page behind each is a blank, so suppressing it loses no content. The back cover keeps the
front's ground and keyline and carries what a back cover is for — what to do next, the QR block,
the campaign label and URL, and the authorisation line.

Back matter is the notes on sources, then the covers.

The record runs to however many leaves the data needs, so the parity of the back matter is not
fixed. The pad that corrects it goes *before* the closing text rather than after: that puts the
text on a verso, so the leaf facing it is the inside back cover and the last spread before the
covers is never two blanks. A build-time check would catch it, but the shape is the point — padding
at the end fixes the parity and leaves a dead spread behind.

The geometry follows where a turn is *heading*, not where it started, so the book widens into a
spread while the front cover is still swinging open and narrows back to a single leaf as the back
cover closes over it, rather than snapping once the turn lands. Page content still follows the
current index; only the layout runs ahead.

### Depth

Each half sits on a block of leaves whose thickness is the honest one — what you have read stacked
left, what is left stacked right — so the depth crosses from one side to the other as you work
through, and each cover closes against a full block.

It is drawn as a staircase of box-shadows behind the page: one copy of the page box per sheet,
stepping outward and down, alternating stock and edge so it striates like a cut block, with a
single soft shadow underneath to ground the whole thing rather than each sheet. The layer count is
fixed at 16 and only the step scales — a shadow list can only interpolate against another list of
the same length, so a varying count would snap instead of animate.

The blocks are siblings of the two slots rather than children, because the left slot clips its own
overflow to collapse and would cut the block off at the spine. They rely on tree order to sit
behind the pages: an explicit `z-index` above `auto` puts them in front of the leaves instead.

Each block is hinged at the spine and keyed to whether its half actually *holds a page*, not to
whether the layout has opened for one — those two differ for the length of a cover turn, since the
geometry runs ahead. A block that followed the layout would put a slab of paper on the table under
a cover still in the air. Nothing is lost by waiting: the block is a fraction of a sheet thick on
the first spread and on the last, so it has nothing to pop from. For the same reason neither half
paints paper for a null page — there is no ground behind the book, and it sits flat on the stage.

Below 860 px the spread collapses to a single page; the aside drops beneath the book. The reading
position is remembered in `localStorage` under `lob-page`.

### Printing

`Cmd/Ctrl-P` swaps the reader out for `PrintBook` and sets the sheet to 105 × 148 mm — 82 pages,
one quotation per leaf and the full voting record after them, each row citing its policy number. Chrome and Safari honour `@page size`; give it
"Print backgrounds" off and no scaling.

## Content

Every quotation in `lib/content.ts` is a placeholder carrying `placeholder: true`, which prints
a **Placeholder** tag on the page. Replace the text and the citation together, then drop the flag.
Set `showPlaceholderTags: false` in `lib/config.ts` to suppress the tags without editing content.

### The voting record is real

The appendix is not a placeholder. `lib/hanson-data.json` is a committed snapshot of the uprise
`civic` schema — `Politician`, `Policy`, `PolicyPosition`, synced from
[They Vote For You](https://theyvoteforyou.org.au) — holding all 184 policies Hanson has actually
cast a vote on. Refresh it with:

```bash
npm run sync:hanson    # DATABASE_URL, else ../uprise/apps/api/.env
```

No credentials live in this repo, and the site stays a fully static build: the snapshot is read at
compile time, so nothing queries a database at build or at request time on Vercel.

`agreement` is They Vote For You's measure — the share of relevant divisions in which the member
voted *in favour* of the policy — so it reads in the direction the policy is worded. "Increasing
trade unions' powers in the workplace: 25%" means she voted against it four times in five;
"decreasing ABC and SBS funding: 96%" means she voted for it. The page states the measure rather
than bucketing it into for/against, and prints each policy's TVFY number so any row can be checked.

The record is a section of the book, not an appendix bolted to the end: it opens on a right-hand
page behind its own title, the way a chapter does, and it is listed in the contents and on the
jump chips. It runs in full — all 184 policies across 27 leaves, grouped into the seven bands of
TVFY's own scale, each band starting on a fresh leaf and continuing across as many as it needs.
Nothing is selected, ranked or trimmed.

**The bands are computed, not read.** The schema has a `category` column that exists to hold
exactly these buckets, but the sync leaves it null — for all 28,313 rows in the table, not just
hers — and there is no other grouping anywhere in the `civic` schema (it holds four tables:
`Politician`, `Policy`, `PolicyPosition`, `CivicSyncRun`). So `bandFor()` derives the band from the
percentage. The percentage prints on every row regardless, so nothing rests on exactly where the
lines fall; move them in `BANDS` if you disagree with them.

Rows are packed by measured height rather than counted, because a 99-character policy name takes
three lines and a short one takes one. Every leaf repeats its band heading, continuations marked
`cont.`, so a spread never shows rows whose heading is two pages back. A band that would end on one
or two stranded rows has its last two leaves poured together and halved.

Each figure carries a colour and an arrow — for at 66 % and over, against under 33 %, mixed
between. The arrow says the same thing as the colour, so the cue does not rest on colour alone, and
the printed weights are darker than the screen ones because a literal yellow is unreadable on white
stock.

### The aside

Two lists, each on a single line, opening on hover into the gutter beside the aside rather than
downward — downward, the first panel lies over the second's header and there is no way to reach it
without leaving the first. Hover alone alternates them; `:focus-within` does the same from a
keyboard. Keeping them collapsed is what lets the book centre against the aside instead of hanging
from the top, and opening them out of flow means the column's height never changes, so the book
never moves.

The record panel lists all 184 policies by title under their band, searchable over title *and*
description — the description is where the subject words live, so "superannuation" often only
matches there. Clicking one opens its detail: what the policy actually says, the figure, the
source's policy number, and a way to the leaf it is printed on.

`lib/config.ts` also carries the cover colour (the design shipped four — see `COVER_COLORS`), the
campaign label and URL on the back cover, and the disclaimer.

## Notes on the port

Three places where this deviates from the source design, all deliberate:

1. **Stage width.** The design reserved single-page width for the closed book while laying the
   row out at spread width, which pushed the cover over the top of the aside. The stage now
   reserves the full row.
2. **Print ground.** The design's `body { background: #08080a }` carried into print and rendered
   the booklet dark-on-dark. The print stylesheet now forces a white sheet.
3. **Cover portrait.** The design's `grayscale(1) contrast(3.2) brightness(1.05)` under
   `mix-blend-mode: multiply` is intact — but it only works because the ground is keyed out of the
   media first. Applied to the original artwork it left a visibly darker rectangle, because a
   luminance treatment cannot separate a ground from skin that sits near it in value.

The back cover is a departure too: the design's was black, with a QR block, the campaign label
and the disclaimer paragraph. That page is gone. The campaign URL survives as the back cover's
footer line; the disclaimer still shows in the reader's aside, and the QR block is not rendered
anywhere. Put them back if the printed booklet needs them.

Small additions: the layout stacks below 860 px rather than overflowing sideways, contents rows
and jump chips are real buttons, Space is left alone when it is about to activate a focused
control, and the leaves are `user-select: none` — dragging a page has to turn it, not sweep a
selection across the type. The aside stays selectable.

`npm audit` reports advisories in `postcss` and `sharp`. Both are transitive build-time
dependencies of Next 16; the only fix npm offers is downgrading Next to 9.x, so they stand.
