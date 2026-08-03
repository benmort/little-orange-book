/**
 * Pulls Pauline Hanson's voting record out of the uprise `civic` schema and
 * writes it to lib/hanson-data.json, which is committed.
 *
 * The booklet stays a fully static build with no database access — this is a
 * snapshot, taken deliberately, not a live query. Re-run it to refresh:
 *
 *   npm run sync:hanson
 *
 * Connection: DATABASE_URL wins if set, otherwise the uprise API's .env is read
 * from ../uprise/apps/api/.env. No credentials are written into this repo.
 *
 * The civic tables are synced from They Vote For You, so `agreement` is their
 * measure: the share of relevant divisions where the member voted in favour of
 * the policy. `category` exists in the schema but is not populated by the sync,
 * so nothing here depends on it — we keep the number and let the page word it.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "pg";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const FALLBACK_ENV = resolve(REPO, "../uprise/apps/api/.env");
const OUT = resolve(REPO, "lib/hanson-data.json");

const MEMBER = "Pauline Hanson";

function connectionString(): string {
  if (process.env.DATABASE_URL) return strip(process.env.DATABASE_URL);
  let env: string;
  try {
    env = readFileSync(FALLBACK_ENV, "utf8");
  } catch {
    throw new Error(
      `Set DATABASE_URL, or make ${FALLBACK_ENV} readable. Nothing is stored in this repo.`,
    );
  }
  const match = env.match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
  if (!match?.[1]?.trim()) throw new Error(`No DATABASE_URL in ${FALLBACK_ENV}.`);
  return strip(match[1].trim());
}

/** Prisma appends ?schema=…, which libpq rejects. */
function strip(url: string): string {
  const parsed = new URL(url);
  parsed.search = "";
  return parsed.toString();
}

interface PoliticianRow {
  tvfyId: number | null;
  name: string;
  party: string | null;
  house: string | null;
  electorate: string | null;
  rebellions: number | null;
  votesAttended: number | null;
  votesPossible: number | null;
  lastSyncedAt: Date | null;
}

interface PositionRow {
  tvfyId: number;
  name: string;
  description: string | null;
  agreement: string | null;
  voted: boolean;
}

async function main() {
  const client = new Client({ connectionString: connectionString() });
  await client.connect();
  try {
    const member = await client.query<PoliticianRow>(
      `select "tvfyId", name, party, house, electorate, rebellions,
              "votesAttended", "votesPossible", "lastSyncedAt"
         from civic."Politician"
        where name = $1`,
      [MEMBER],
    );
    if (member.rowCount !== 1) {
      throw new Error(`Expected exactly one ${MEMBER}; found ${member.rowCount}.`);
    }

    // Only positions she actually voted on — an agreement score with no
    // divisions behind it is not a record of anything.
    const positions = await client.query<PositionRow>(
      `select pol."tvfyId", pol.name, pol.description, pp.agreement, pp.voted
         from civic."PolicyPosition" pp
         join civic."Politician" p on p.id = pp."politicianId"
         join civic."Policy" pol on pol.id = pp."policyId"
        where p.name = $1 and pp.voted
        order by pp.agreement asc, pol.name asc`,
      [MEMBER],
    );

    const m = member.rows[0];
    const snapshot = {
      source: "They Vote For You",
      sourceUrl: m.tvfyId ? `https://theyvoteforyou.org.au/people/senate/${m.tvfyId}` : null,
      note: "agreement is the share of relevant divisions in which the member voted in favour of the policy.",
      politician: {
        name: m.name,
        party: m.party,
        house: m.house,
        electorate: m.electorate,
        rebellions: m.rebellions,
        votesAttended: m.votesAttended,
        votesPossible: m.votesPossible,
        lastSyncedAt: m.lastSyncedAt?.toISOString() ?? null,
      },
      positions: positions.rows.map((r) => ({
        tvfyId: r.tvfyId,
        policy: r.name,
        description: r.description,
        agreement: r.agreement === null ? null : Number(r.agreement),
      })),
    };

    writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(
      `Wrote ${OUT}\n  ${snapshot.positions.length} voted positions for ${m.name} (${m.party})\n  ${m.votesAttended}/${m.votesPossible} divisions attended`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
