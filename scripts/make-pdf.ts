/**
 * Renders the booklet to public/little-orange-book.pdf — the file the download
 * button serves.
 *
 *   npm run pdf                        # against a running dev/prod server
 *   BASE=http://localhost:3000 npm run pdf
 *
 * A committed artefact, not a runtime one. Generating a 65-page PDF per request
 * would mean running a browser on the server; the booklet changes when someone
 * edits it, not when someone downloads it. **Re-run this after changing any
 * content** — nothing checks that the file matches the site.
 *
 * It drives headless Chrome over the DevTools protocol rather than using a
 * library: the print layout is CSS (`@page { size: 105mm 148mm }` and the
 * screen/print swap in globals.css), so the only renderer that can be trusted
 * to produce what Cmd-P produces is the same engine.
 *
 * `preferCSSPageSize` is what honours that @page rule — without it Chrome
 * prints US Letter and the booklet arrives scaled and wrong.
 */
import { writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(REPO, "public/little-orange-book.pdf");
const BASE = process.env.BASE ?? "http://localhost:3111";
const PORT = 9333;

const CHROME =
  process.env.CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${resolve(REPO, "node_modules/.cache/pdf-chrome")}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    // Wait for the debugging port rather than guessing at a delay.
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
    const pending = new Map<number, (value: Record<string, unknown>) => void>();
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
    await send("Page.navigate", { url: BASE });
    // Fonts and the record's 30 leaves need a moment to lay out.
    await sleep(4000);

    const { data } = (await send("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true,
    })) as { data: string };

    const pdf = Buffer.from(data, "base64");
    writeFileSync(OUT, pdf);

    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    console.log(`Wrote ${OUT}\n  ${pages} pages, ${(pdf.length / 1024).toFixed(0)} kB, from ${BASE}`);
    socket.close();
  } finally {
    chrome.kill();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
