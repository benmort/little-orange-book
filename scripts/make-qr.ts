/**
 * Renders the back cover's QR code from `campaignUrl` in lib/config.ts and
 * writes it to public/campaign-qr.svg, which is committed.
 *
 *   npm run qr
 *
 * A build-time artefact rather than a runtime one: the code never changes
 * between requests, and a QR library in the client bundle to draw a fixed
 * square would be a megabyte of JavaScript doing nothing.
 *
 * SVG, not PNG. The code prints at roughly 25 mm on a 105 mm page and also
 * renders at 92 px on screen; a raster would have to be sized for the larger of
 * those and would still soften the module edges that a scanner reads.
 *
 * Encodes the URL with its scheme even though the cover prints it without —
 * scanners key off the scheme to offer "open link", and a bare domain is
 * treated as plain text by some of them.
 *
 * Error correction is deliberately Q. The rule of thumb is L for screens and M
 * for print, but this one goes on a booklet that will be folded, pocketed and
 * handed over; Q tolerates about a quarter of the code being damaged, and the
 * cost is a slightly denser grid.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import jsQR from "jsqr";
import QRCode from "qrcode";
import sharp from "sharp";

import { bookConfig } from "../lib/config";

/** The size the code is printed and rendered at, in CSS pixels. */
const RENDERED_PX = 92;

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/campaign-qr.svg");

const target = bookConfig.campaignUrl.startsWith("http")
  ? bookConfig.campaignUrl
  : `https://${bookConfig.campaignUrl}`;

async function main() {
  const svg = await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "Q",
    // The cover already frames the code in a white box with its own padding, so
    // the code does not carry a second quiet zone inside it.
    margin: 0,
    color: { dark: "#000000", light: "#ffffff" },
  });

  writeFileSync(OUT, `${svg.trim()}\n`);

  /* Scan it back before calling it done. A longer campaignUrl pushes the code
     to a denser version, and past a point it stops reading at the size it is
     printed — which is not something you want to find out from the printed
     booklet. Rasterised at the size it actually appears, with the quiet zone
     the cover's white box provides. */
  const pad = Math.round(RENDERED_PX * 0.08);
  const inner = RENDERED_PX - pad * 2;
  const raster = await sharp(Buffer.from(svg), { density: 900 })
    .resize(inner, inner, { kernel: "nearest" })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#fff" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const decoded = jsQR(
    new Uint8ClampedArray(raster.data),
    raster.info.width,
    raster.info.height,
  );

  if (decoded?.data !== target) {
    throw new Error(
      `The code does not scan at ${RENDERED_PX}px: expected ${target}, read ${decoded?.data ?? "nothing"}. ` +
        "Shorten campaignUrl, or print the code larger.",
    );
  }

  console.log(`Wrote ${OUT}\n  encodes ${target}\n  verified: scans at ${RENDERED_PX}px`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
