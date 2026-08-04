import hansonData from "./hanson-data.json";
import quotationsData from "./quotations.json";

/**
 * Content for "Quotations from Pauline Hanson".
 *
 * Every quotation is a placeholder until it is sourced. The `placeholder` flag
 * drives the "Placeholder" tag printed on the quote pages, so nothing goes out
 * the door pretending to be on the record before it is.
 */

export interface Chapter {
  /** Short label used on the jump chips and the quote-page kicker. */
  short: string;
  heading: string;
  body: string;
  quotes: Array<{ quote: string; cite: string }>;
}

/**
 * Verified quotations, keyed by chapter. Each one displaces a placeholder in the
 * order they are listed; a chapter with fewer than three keeps its placeholders
 * for the rest, tagged as such on the page. Nothing here is quoted from memory —
 * see lib/quotations.json for how each was checked, and what still needs a last
 * look at Hansard before a print run.
 */
export interface Quotation {
  id: string;
  chapter: string;
  text: string;
  occasion: string;
  date: string;
  cite: string;
  sourceType: string;
  url: string;
  verification: string;
}

export const QUOTATIONS: Quotation[] = quotationsData.quotations;

const VERIFIED_BY_CHAPTER = QUOTATIONS.reduce<Record<string, Quotation[]>>((acc, q) => {
  (acc[q.chapter] ??= []).push(q);
  return acc;
}, {});

export const CHAPTERS: Chapter[] = [
  {
    short: "On Wages",
    heading: "On Wages and Penalty Rates",
    body: "What she has said about what your hours are worth.",
    quotes: [
      {
        quote: "Placeholder — statement opposing an above-inflation increase to the minimum wage.",
        cite: "National Press Club, Canberra · date to be confirmed",
      },
      {
        quote: "Placeholder — remark on Sunday and public holiday penalty rates and small business costs.",
        cite: "Senate Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on what a wage rise does to employers.",
        cite: "Radio interview · outlet and date to be confirmed",
      },
    ],
  },
  {
    short: "On Unions",
    heading: "On Unions and the Right to Organise",
    body: "What she has said about the organisations that won the weekend.",
    quotes: [
      {
        quote: "Placeholder — characterisation of union officials and their role on worksites.",
        cite: "Senate Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — remark on right-of-entry provisions.",
        cite: "Media release · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on union membership and dues.",
        cite: "Television interview · outlet and date to be confirmed",
      },
    ],
  },
  {
    short: "On Job Security",
    heading: "On Casual Work and Job Security",
    body: "What she has said about knowing whether you work next week.",
    quotes: [
      {
        quote: "Placeholder — position on casual conversion rights.",
        cite: "Senate Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — remark on labour hire and contracting.",
        cite: "Committee transcript · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on part-time and gig work.",
        cite: "Press conference · date to be confirmed",
      },
    ],
  },
  {
    short: "On Dismissal",
    heading: "On Sacking People",
    body: "What she has said about how easily you can lose the job.",
    quotes: [
      {
        quote: "Placeholder — statement that businesses need greater power to dismiss staff.",
        cite: "National Press Club, Canberra · date to be confirmed",
      },
      {
        quote: "Placeholder — remark on the unfair dismissal regime.",
        cite: "Senate Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on probation periods.",
        cite: "Interview · outlet and date to be confirmed",
      },
    ],
  },
  {
    short: "On Safety",
    heading: "On Workplace Safety",
    body: "What she has said about getting home in one piece.",
    quotes: [
      {
        quote: "Placeholder — remark on workplace health and safety regulation as red tape.",
        cite: "Senate Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — position on industrial manslaughter laws.",
        cite: "Media release · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on silica, asbestos or dust disease measures.",
        cite: "Committee transcript · date to be confirmed",
      },
    ],
  },
  {
    short: "On Super",
    heading: "On Superannuation",
    body: "What she has said about the wage you get paid later.",
    quotes: [
      {
        quote: "Placeholder — position on the superannuation guarantee rate.",
        cite: "Senate Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — remark on early access to superannuation.",
        cite: "Press conference · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on industry funds.",
        cite: "Interview · outlet and date to be confirmed",
      },
    ],
  },
  {
    short: "On Race",
    heading: "On Immigration and Race",
    body: "What she has said about who counts as Australian.",
    quotes: [
      {
        quote: "Placeholder — quotation from the 1996 first speech.",
        cite: "House of Representatives Hansard, 10 September 1996",
      },
      {
        quote: "Placeholder — quotation from the 2016 first speech to the Senate.",
        cite: "Senate Hansard, 14 September 2016",
      },
      {
        quote: "Placeholder — later remark on migration and multiculturalism.",
        cite: "Interview · outlet and date to be confirmed",
      },
    ],
  },
  {
    short: "On First Nations",
    heading: "On First Nations Australians",
    body: "What she has said about the country's oldest communities.",
    quotes: [
      {
        quote: "Placeholder — remark on native title or land rights.",
        cite: "Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — statement during the Voice referendum campaign.",
        cite: "Press conference · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on Welcome to Country.",
        cite: "Senate Hansard · date to be confirmed",
      },
    ],
  },
  {
    short: "On Women",
    heading: "On Women and Family",
    body: "What she has said about half the workforce.",
    quotes: [
      {
        quote: "Placeholder — remark on paid parental leave.",
        cite: "Senate Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on domestic violence policy.",
        cite: "Television interview · outlet and date to be confirmed",
      },
      {
        quote: "Placeholder — statement on childcare and women returning to work.",
        cite: "Media release · date to be confirmed",
      },
    ],
  },
  {
    short: "On Energy",
    heading: "On Climate and Energy Jobs",
    body: "What she has said about the industries people work in next.",
    quotes: [
      {
        quote: "Placeholder — statement on climate science.",
        cite: "Senate Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — remark on renewable energy projects and regional jobs.",
        cite: "Press conference · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on the transition for coal and gas workers.",
        cite: "Interview · outlet and date to be confirmed",
      },
    ],
  },
  {
    short: "On Public Services",
    heading: "On Public Servants",
    body: "What she has said about the people who run the country's services.",
    quotes: [
      {
        quote: "Placeholder — remark on the size of the public service.",
        cite: "National Press Club, Canberra · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on working from home arrangements.",
        cite: "Interview · outlet and date to be confirmed",
      },
      {
        quote: "Placeholder — statement on cutting departments or agencies.",
        cite: "Media release · date to be confirmed",
      },
    ],
  },
  {
    short: "On Health",
    heading: "On Health and Science",
    body: "What she has said when the evidence was inconvenient.",
    quotes: [
      {
        quote: "Placeholder — remark on vaccination mandates for workers.",
        cite: "Senate Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on pandemic public health measures.",
        cite: "Press conference · date to be confirmed",
      },
      {
        quote: "Placeholder — statement on medical expertise.",
        cite: "Interview · outlet and date to be confirmed",
      },
    ],
  },
  {
    short: "On the Press",
    heading: "On the Press and Democracy",
    body: "What she has said about being asked a question.",
    quotes: [
      {
        quote: "Placeholder — remark about journalists at a press conference.",
        cite: "National Press Club, Canberra · date to be confirmed",
      },
      {
        quote: "Placeholder — comment on electoral processes.",
        cite: "Senate Hansard · date to be confirmed",
      },
      {
        quote: "Placeholder — statement on protest and dissent.",
        cite: "Media release · date to be confirmed",
      },
    ],
  },
];

/* ── The voting record ──────────────────────────────────────────────────────
   Real, unlike the quotations. lib/hanson-data.json is a committed snapshot of
   the uprise `civic` schema, which is synced from They Vote For You; regenerate
   it with `npm run sync:hanson`. Every row below is a policy she has actually
   voted on, and every one carries its TVFY policy id so it can be checked.   */

export interface VoteRow {
  /** They Vote For You policy id — the citation. */
  tvfyId: number;
  policy: string;
  /** The source's own one-line statement of what the policy is. */
  description: string;
  /** Share of relevant divisions where she voted in favour, 0–100. */
  agreement: number;
}

/** Policy names arrive from the source in sentence case with no initial cap. */
const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** The member, straight from the snapshot. */
export const MEMBER = hansonData.politician;
export const RECORD_SOURCE = hansonData.source;
export const RECORD_SOURCE_URL = hansonData.sourceUrl;

/** Every policy she has cast a vote on, worst agreement first. */
export const ALL_POSITIONS: VoteRow[] = hansonData.positions.flatMap((p) =>
  typeof p.agreement === "number"
    ? [
        {
          tvfyId: p.tvfyId,
          policy: capitalise(p.policy),
          description: capitalise(p.description ?? ""),
          agreement: p.agreement,
        },
      ]
    : [],
);

/**
 * The bands the record is grouped into. These are They Vote For You's own
 * scale — the seven buckets the schema's `category` column exists to hold. The
 * sync does not populate that column (it is null for all 28,313 rows in the
 * table, not just hers), so the band is computed from the percentage instead.
 * The percentage prints on every row either way, so nothing rests on where
 * exactly the lines fall.
 */
const BANDS: Array<{ label: string; short: string; from: number }> = [
  { label: "Voted very strongly for", short: "Very strongly for", from: 95 },
  { label: "Voted strongly for", short: "Strongly for", from: 85 },
  { label: "Voted moderately for", short: "Moderately for", from: 60 },
  { label: "Voted a mixture of for and against", short: "Mixed", from: 40 },
  { label: "Voted moderately against", short: "Moderately against", from: 15 },
  { label: "Voted strongly against", short: "Strongly against", from: 5 },
  { label: "Voted very strongly against", short: "Very strongly against", from: 0 },
];

/**
 * A coarser read than the seven bands, for the figure itself: did she vote for
 * this, against it, or neither. The arrow carries the same information as the
 * colour, so the cue does not rest on colour alone.
 */
export type Verdict = "for" | "mixed" | "against";

export function verdictFor(agreement: number): Verdict {
  if (agreement >= 66) return "for";
  if (agreement >= 33) return "mixed";
  return "against";
}

export const VERDICT_GLYPH: Record<Verdict, string> = {
  for: "\u2191",
  mixed: "\u2013",
  against: "\u2193",
};

export function bandFor(agreement: number): string {
  return (BANDS.find((b) => agreement >= b.from) ?? BANDS[BANDS.length - 1]).label;
}

/* Rows are laid out on a fixed 380 × 570 leaf, so they have to be packed by
   height rather than counted: a 99-character policy name takes three lines and
   a short one takes one. These are the measured costs of the row styles. */
const ROW_CHARS_PER_LINE = 46;
const ROW_LINE_H = 15;
/** Policy-number line, the row's own padding and rule, and the column's gap. */
const ROW_CHROME_H = 32;
/* Every leaf carries the band heading, continuations included, so they all
   have the same chrome and the same budget. */
const PAGE_BODY_H = 392;

function rowHeight(row: VoteRow): number {
  const lines = Math.max(1, Math.ceil(row.policy.length / ROW_CHARS_PER_LINE));
  return lines * ROW_LINE_H + ROW_CHROME_H;
}

export interface RecordPage {
  band: string;
  rows: VoteRow[];
  /** False on the first leaf of a band, so only that one carries the heading. */
  continued: boolean;
}

/**
 * Every policy she has voted on, grouped by band and packed onto as many leaves
 * as it takes. Each band starts on a fresh leaf so the reader can always see
 * which one they are in.
 */
export const RECORD_PAGES: RecordPage[] = BANDS.flatMap(({ label }) => {
  const rows = ALL_POSITIONS.filter((p) => bandFor(p.agreement) === label).sort(
    (a, b) => b.agreement - a.agreement || a.policy.localeCompare(b.policy),
  );
  if (rows.length === 0) return [];

  const pages: RecordPage[] = [];
  let current: VoteRow[] = [];
  let used = 0;
  for (const row of rows) {
    const budget = PAGE_BODY_H;
    const h = rowHeight(row);
    if (current.length > 0 && used + h > budget) {
      pages.push({ band: label, rows: current, continued: pages.length > 0 });
      current = [];
      used = 0;
    }
    current.push(row);
    used += h;
  }
  if (current.length > 0) pages.push({ band: label, rows: current, continued: pages.length > 0 });

  /* A band that ends on one or two stranded rows reads as a mistake. Pour the
     last two leaves back together and halve them — both halves are comfortably
     under budget, since the fuller of the two already fitted on its own. */
  if (pages.length > 1 && pages[pages.length - 1].rows.length < 3) {
    const tail = [...pages[pages.length - 2].rows, ...pages[pages.length - 1].rows];
    const split = Math.ceil(tail.length / 2);
    pages.splice(pages.length - 2, 2, {
      band: label,
      rows: tail.slice(0, split),
      continued: pages.length > 2,
    });
    pages.push({ band: label, rows: tail.slice(split), continued: true });
  }
  return pages;
});

export type PageType =
  | "cover"
  | "blank"
  | "text"
  | "contents"
  | "chapter"
  | "quote"
  | "section"
  | "table"
  | "back";

export interface Page {
  type: PageType;
  /** Printed page number. The cover carries none. */
  folio: string;
  /** Chapter number, on chapter pages. */
  n?: number;
  /** Short chapter label, carried onto that chapter's quote pages. */
  short?: string;
  kicker?: string;
  heading?: string;
  body?: string;
  body2?: string;
  body3?: string;
  quote?: string;
  cite?: string;
  placeholder?: boolean;
  /** Set on quotation leaves that carry a sourced quotation. */
  quoteId?: string;
  note?: string;
  /** Section openers: the line under the rule. */
  lead?: string;
  /** Voting-record leaves only. */
  band?: string;
  rows?: VoteRow[];
  continued?: boolean;
}

/**
 * The booklet, in reading order: front matter, thirteen chapters of three
 * quotations each, the voting record, a note on sources, back cover.
 */
function buildPages(): Page[] {
  const pages: Omit<Page, "folio">[] = [{ type: "cover" }];

  // The inside of the front cover, blank as it is on a real book.
  pages.push({ type: "blank" });

  pages.push({
    type: "text",
    kicker: "Imprint",
    heading: "About this booklet",
    body: "This is a pocket record of things one senator has said, in public, on the record. Nothing here is paraphrased. Each quotation carries its source so you can check it yourself.",
    body2:
      "It exists because a person who says she speaks for working people has spent three decades saying otherwise whenever the subject was wages, safety, security or the right to organise.",
    /* Described, not quoted. Both speeches are matters of public record and the
       chapter on race cites them by date, but this page carries no Placeholder
       tag — so nothing on it is set in quotation marks unless it has been
       checked. The three figures come from the committed snapshot. */
    body3:
      "Race is the throughline. Her first speech to the House of Representatives in 1996 and her first speech to the Senate twenty years later made the same warning about immigration, naming a different people each time. The votes read the same way: 100 per cent in favour of turning back asylum boats, 6 per cent for increasing Aboriginal land rights, nought for implementing the Uluru Statement from the Heart in full.",
  });

  pages.push({
    type: "text",
    kicker: "Foreword",
    heading: "How to use this book",
    body: "Read one page while the train pulls out. Read the source line under it. If a quotation surprises you, look it up — the citation is there for exactly that reason.",
    body2: "Then hand the book to someone who has never had a reason to look.",
  });

  pages.push({ type: "contents" });

  // A blank verso, so chapter one opens on a right-hand page — and since every
  // chapter runs exactly four pages, so does every chapter after it.
  pages.push({ type: "blank" });

  /* Only chapters with something sourced appear. A chapter whose quotations are
     all still placeholders would be an opener leading nowhere, and a booklet
     whose promise is that every quotation is checkable should not print the
     ones that are not yet. The unsourced chapters stay in CHAPTERS as the brief
     for what to look for — they return to the book the moment lib/quotations.json
     carries one, and the numbering closes up behind them meanwhile. */
  const sourcedChapters = CHAPTERS.filter(
    (chapter) => (VERIFIED_BY_CHAPTER[chapter.short] ?? []).length > 0,
  );

  sourcedChapters.forEach((chapter, index) => {
    pages.push({
      type: "chapter",
      n: index + 1,
      short: chapter.short,
      heading: chapter.heading,
      body: chapter.body,
    });

    /* A chapter runs as many quotation leaves as it has sourced quotations. */
    const quotes = (VERIFIED_BY_CHAPTER[chapter.short] ?? []).map((q) => ({
      quote: q.text,
      cite: q.cite,
      placeholder: false,
      id: q.id,
    }));

    quotes.forEach((q) => {
      pages.push({
        type: "quote",
        short: chapter.short,
        kicker: chapter.short,
        quote: q.quote,
        cite: q.cite,
        placeholder: q.placeholder,
        quoteId: q.id,
      });
    });

    /* The opener plus its quotations has to come to an even number of leaves,
       or the next chapter opens on a verso. Chapters used to be four pages
       each, which made this automatic; variable-length ones do not. */
    if ((1 + quotes.length) % 2 === 1) pages.push({ type: "blank" });
  });

  /* The record is a section of the book, not an appendix bolted to the end, so
     it opens the way a chapter does — on a right-hand page, behind its own
     title. Its length is data-dependent, so pad to get there. */
  if (pages.length % 2 === 1) pages.push({ type: "blank" });
  pages.push({
    type: "section",
    short: "The Record",
    heading: "The voting record",
    body: "What she has done about it, every time the Senate divided.",
    lead: `All ${ALL_POSITIONS.length} policies she has cast a vote on, grouped as ${RECORD_SOURCE} groups them.`,
  });

  RECORD_PAGES.forEach((page, n) => {
    pages.push({
      type: "table",
      band: page.band,
      rows: page.rows,
      continued: page.continued,
      note:
        n === RECORD_PAGES.length - 1
          ? `Per cent of relevant divisions in which she voted in favour, and the band that falls in. Source: ${RECORD_SOURCE}; policy numbers are theirs. She has attended ${MEMBER.votesAttended?.toLocaleString()} of ${MEMBER.votesPossible?.toLocaleString()} divisions.`
          : undefined,
    });
  });

  /* The record runs to however many leaves the data needs, so the parity of the
     back matter is not fixed. Pad here rather than later: putting the closing
     text on a verso means the leaf facing it is the inside back cover, and the
     last spread before the covers is never two blanks. */
  if (pages.length % 2 === 0) pages.push({ type: "blank" });

  pages.push({
    type: "text",
    kicker: "Sources",
    heading: "Notes on sources",
    body: "Every quotation is to be cited to Hansard, a broadcast transcript, or a named publication with a date. Where a remark exists only on video, the citation will name the programme and the date of broadcast.",
    body2: "Corrections are welcome and will be made.",
  });


  /* The closing leaf, mirroring the opening one. The front cover is the recto
     of leaf one and turns away to the left; the back cover is the verso of the
     last leaf, so that same leftward fold brings it face up on the left — the
     book closed from the back. The trailing blank exists only to give that leaf
     a recto to occupy; the reader never shows it. */
  pages.push({ type: "blank" }); // inside the back cover
  pages.push({ type: "back" });
  pages.push({ type: "blank" });

  return pages.map((page, n) => ({ ...page, folio: n === 0 ? "" : String(n) }));
}

export const PAGES: Page[] = buildPages();

/** [page, index] pairs for every chapter opener — drives the contents and the jump chips. */
export const CHAPTER_STARTS: Array<{ page: Page; index: number }> = PAGES.map((page, index) => ({
  page,
  index,
})).filter((entry) => entry.page.type === "chapter" || entry.page.type === "section");

/** Which leaf each policy is printed on, so the aside can send you to it. */
export const POLICY_PAGE = new Map<number, number>(
  PAGES.flatMap((page, index) => (page.rows ?? []).map((row) => [row.tvfyId, index] as const)),
);

/**
 * The shape of the record in seven lines, for the reader's aside — how many
 * policies fall in each band, and where that band starts in the book.
 */
export const BAND_SUMMARY = BANDS.map(({ label, short }) => ({
  label,
  short,
  count: ALL_POSITIONS.filter((p) => bandFor(p.agreement) === label).length,
  index: PAGES.findIndex((p) => p.type === "table" && p.band === label),
})).filter((band) => band.count > 0 && band.index >= 0);

/** The pages that make it into the 105 × 148 mm print booklet. */
export const PRINT_PAGES = PAGES.filter(
  (p) =>
    p.type === "quote" ||
    p.type === "text" ||
    p.type === "chapter" ||
    p.type === "section" ||
    p.type === "table",
).map((p) => ({
  kicker:
    p.type === "table"
      ? p.band ?? ""
      : p.type === "section"
        ? "Section"
        : p.kicker || `Chapter ${p.n ?? ""}`,
  heading: p.type === "quote" ? p.quote ?? "" : p.heading ?? "",
  body: p.type === "quote" ? "" : p.body ?? "",
  cite: p.cite ?? p.note ?? "",
  rows: p.rows ?? [],
}));
