/**
 * Gathers candidate quotations for the booklet's chapters out of Hansard.
 *
 *   npm run quotes            # every chapter
 *   npm run quotes -- Wages   # one, by the chapter's short label
 *
 * Writes output/quote-candidates.json — deliberately *not* lib/. These are
 * candidates, not content. Choosing which passage becomes a quotation, and
 * trimming it fairly, is an editorial act; this script's job is to put real
 * sourced passages in front of a person, not to fill the booklet by itself.
 * Nothing here should reach a quote page without someone reading it in context.
 *
 * ## Why it works the way it does
 *
 * OpenAustralia's API cannot do this on its own. `getDebates`/`getHansard` both
 * return HTTP 500 for `search=` and for `person=`, and the person path reports
 * `section:lords` — the Australian fork inherited TheyWorkForYou's chamber
 * mapping and the Senate does not survive it. So discovery goes through the
 * website's search, which does support `speaker:<person_id> "phrase"`, and the
 * text comes back through the API by `gid`, where it arrives as clean JSON with
 * the speaker attached and a link to the ParlInfo original.
 *
 * Every hit is checked for the phrase before it is kept. The website's search
 * matches more loosely than a phrase query implies — searching for "penalty
 * rates" returns speeches about Closing the Gap — so roughly one candidate in
 * six is dropped here rather than wasting a reader's time.
 *
 * ## What this cannot reach
 *
 * Her OpenAustralia member record starts 2016-07-01, so this covers her current
 * Senate term only. The 1996 first speech — which two chapters cite — is not in
 * this source at all and has to come from APH's own ParlInfo. Nor is anything
 * said outside parliament: the press conferences, radio and television
 * interviews and media releases that many of the placeholders cite.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(REPO, "output/quote-candidates.json");

/** Her OpenAustralia person id — the same number as the TVFY id in the snapshot. */
const PERSON_ID = "10280";
const UA = "little-orange-book/1.0 (research; tech-contractors@getup.org.au)";
/** Their servers are a charity's. One request a second. */
const DELAY_MS = 1000;

/** Phrases to look for, per chapter. Quoted: an unquoted query matches far wider. */
const CHAPTER_PHRASES: Record<string, string[]> = {
  Wages: ["penalty rates", "minimum wage", "take-home pay"],
  Unions: ["trade union", "union officials", "right of entry"],
  "Job Security": ["casual workers", "labour hire", "job security"],
  Dismissal: ["unfair dismissal", "sack workers"],
  Safety: ["workplace safety", "industrial manslaughter", "silicosis"],
  Super: ["superannuation guarantee", "superannuation"],
  Race: ["multiculturalism", "immigration levels", "swamped"],
  "First Nations": ["native title", "Uluru Statement", "Welcome to Country"],
  Women: ["paid parental leave", "domestic violence", "child care"],
  Energy: ["climate change", "net zero", "coal-fired"],
  "Public Services": ["public service", "working from home"],
  Health: ["vaccine mandate", "pandemic"],
  Press: ["press freedom", "the media"],
};

function apiKey(): string {
  if (process.env.OPENAUSTRALIA_API_KEY) return process.env.OPENAUSTRALIA_API_KEY.trim();
  try {
    const env = readFileSync(resolve(REPO, ".env.local"), "utf8");
    const found = env.match(/^OPENAUSTRALIA_API_KEY\s*=\s*"?([^"\n]+)"?/m)?.[1]?.trim();
    if (found) return found;
  } catch {
    // fall through to the error below
  }
  throw new Error("Set OPENAUSTRALIA_API_KEY, or put it in .env.local. Keys: openaustralia.org.au/api/key");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const strip = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#8212;/g, " — ")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Website search — the API's own search endpoint is broken for the Senate. */
async function findGids(phrase: string): Promise<string[]> {
  const query = encodeURIComponent(`speaker:${PERSON_ID} "${phrase}"`);
  const response = await fetch(`https://www.openaustralia.org.au/search/?s=${query}`, {
    headers: { "user-agent": UA },
  });
  if (!response.ok) return [];
  const html = await response.text();
  const ids = [...html.matchAll(/href="\/senate\/\?id=([\d\-.]+)/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

interface Candidate {
  chapter: string;
  phrase: string;
  date: string;
  gid: string;
  text: string;
  openAustraliaUrl: string;
  hansardUrl: string | null;
}

async function fetchSpeech(gid: string, key: string) {
  const url = `https://www.openaustralia.org.au/api/getDebates?type=senate&gid=${gid}&output=js&key=${key}`;
  const response = await fetch(url, { headers: { "user-agent": UA } });
  if (!response.ok) return null;

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  for (const row of rows) {
    const entry = (row.entry ?? row) as Record<string, unknown>;
    const speaker = entry.speaker as { person_id?: string | number } | null;
    // Sections come back with their headings attached; only her own turns count.
    if (speaker && String(speaker.person_id) === PERSON_ID) {
      return {
        date: String(entry.hdate),
        gid: String(entry.gid),
        text: strip(String(entry.body ?? "")),
        hansardUrl: (entry.source_url as string) ?? null,
      };
    }
  }
  return null;
}

async function main() {
  const key = apiKey();
  const only = process.argv[2];
  const chapters = Object.entries(CHAPTER_PHRASES).filter(
    ([name]) => !only || name.toLowerCase().includes(only.toLowerCase()),
  );
  if (chapters.length === 0) throw new Error(`No chapter matches "${only}".`);

  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  let dropped = 0;

  for (const [chapter, phrases] of chapters) {
    for (const phrase of phrases) {
      const gids = await findGids(phrase);
      await sleep(DELAY_MS);

      for (const gid of gids) {
        if (seen.has(gid)) continue;
        const speech = await fetchSpeech(gid, key);
        await sleep(DELAY_MS);
        if (!speech) continue;

        // The search matches wider than the phrase; keep only the real hits.
        if (!speech.text.toLowerCase().includes(phrase.toLowerCase())) {
          dropped += 1;
          continue;
        }

        seen.add(gid);
        candidates.push({
          chapter,
          phrase,
          date: speech.date,
          gid: speech.gid,
          text: speech.text,
          openAustraliaUrl: `https://www.openaustralia.org.au/senate/?id=${speech.gid}`,
          hansardUrl: speech.hansardUrl,
        });
      }
      console.log(`  ${chapter} · "${phrase}": ${gids.length} results`);
    }
  }

  candidates.sort((a, b) => a.chapter.localeCompare(b.chapter) || b.date.localeCompare(a.date));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        source: "OpenAustralia.org.au (Australian Hansard)",
        personId: PERSON_ID,
        note: "Candidates only. Read each in context before quoting; trim fairly and keep the date.",
        coverage: "Her current Senate term, from 2016-07-01. Nothing earlier, and nothing said outside parliament.",
        candidates,
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    `\nWrote ${OUT}\n  ${candidates.length} candidates across ${new Set(candidates.map((c) => c.chapter)).size} chapters` +
      `\n  ${dropped} dropped for not containing the phrase they were found by`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
