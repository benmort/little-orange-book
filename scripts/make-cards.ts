/**
 * Renders one shareable card per sourced quotation into public/cards/<id>.png.
 *
 *   npm run cards
 *
 * Square, because that is what survives Instagram, and it crops civilly on the
 * platforms that want a rectangle. Committed rather than generated per request:
 * there are twelve of them and they change when someone edits a quotation, not
 * when someone shares one.
 *
 * Rendered by headless Chrome from a standalone page rather than by an image
 * library, because the card is the book's typography — Caprasimo for the
 * quotation, Figtree for the source line — and a canvas that cannot lay out a
 * webfont would be drawing something else. The fonts are fetched from Google at
 * generation time only; nothing on the site loads them from there.
 *
 * The long quotations are the hard case: the type steps down by length rather
 * than wrapping out of the card, and the longest one here is 350 characters.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import quotations from "../lib/quotations.json";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(REPO, "public/cards");
const PORT = 9334;
const SIZE = 1080;
const CHROME =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Long quotations get smaller type rather than a taller card. */
function quoteSize(length: number): number {
  if (length > 300) return 40;
  if (length > 200) return 48;
  if (length > 120) return 58;
  return 70;
}

function cardHtml(text: string, cite: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caprasimo&family=Figtree:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${SIZE}px; height: ${SIZE}px; background: #ff5a00; color: #000;
         font-family: Figtree, sans-serif; overflow: hidden; }
  .frame { position: absolute; inset: 34px; border: 6px solid #000; }
  .inner { position: absolute; inset: 34px; padding: 72px; display: flex;
           flex-direction: column; }
  /* The quotation takes the middle; short ones sit centred rather than
     stranded at the top of a square. */
  .body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .mark { font-family: Caprasimo, serif; font-size: 96px; line-height: 0.6; }
  .quote { font-family: Caprasimo, serif; line-height: 1.16; letter-spacing: -0.01em;
           font-size: ${quoteSize(text.length)}px; }
  .foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; }
  .cite { font-size: 21px; line-height: 1.45; max-width: 66%; }
  .brand { font-family: Caprasimo, serif; font-size: 19px; text-transform: uppercase;
           letter-spacing: 0.06em; text-align: right; }
</style></head><body>
<div class="frame"></div>
<div class="inner">
  <div class="body">
    <div class="mark">&ldquo;</div>
    <div class="quote">${escapeHtml(text)}</div>
  </div>
  <div class="foot">
    <div class="cite">${escapeHtml(cite)}</div>
    <div class="brand">The Little<br>Orange Book<br>littleorangebook.com.au</div>
  </div>
</div></body></html>`;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${resolve(REPO, "node_modules/.cache/card-chrome")}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    type Target = { webSocketDebuggerUrl: string };
    let target: Target | null = null;
    for (let attempt = 0; attempt < 40 && !target; attempt += 1) {
      try {
        const response = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
          method: "PUT",
        });
        if (response.ok) target = (await response.json()) as Target;
      } catch {
        await sleep(250);
      }
    }
    if (!target) throw new Error(`Chrome did not open a debugging port on ${PORT}.`);

    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => socket.addEventListener("open", r));
    let id = 0;
    const pending = new Map<number, (v: Record<string, unknown>) => void>();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as { id?: number; result?: unknown };
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)!(message.result as Record<string, unknown>);
        pending.delete(message.id);
      }
    });
    const send = (method: string, params: Record<string, unknown> = {}) =>
      new Promise<Record<string, unknown>>((resolve_) => {
        const n = (id += 1);
        pending.set(n, resolve_);
        socket.send(JSON.stringify({ id: n, method, params }));
      });

    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: SIZE,
      height: SIZE,
      deviceScaleFactor: 1,
      mobile: false,
    });

    for (const q of quotations.quotations) {
      const html = cardHtml(q.text, q.cite);
      await send("Page.navigate", {
        url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      });
      // Webfonts arrive after the document; screenshotting early gets fallbacks.
      await sleep(1600);
      const { data } = (await send("Page.captureScreenshot", { format: "png" })) as {
        data: string;
      };
      writeFileSync(resolve(OUT_DIR, `${q.id}.png`), Buffer.from(data, "base64"));
      console.log(`  ${q.id}.png`);
    }

    console.log(`\nWrote ${quotations.quotations.length} cards to ${OUT_DIR}`);
    socket.close();
  } finally {
    chrome.kill();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
