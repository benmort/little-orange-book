import hansonData from "./hanson-data.json";

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
  /** Share of relevant divisions where she voted in favour, 0–100. */
  agreement: number;
}

/** The member, straight from the snapshot. */
export const MEMBER = hansonData.politician;
export const RECORD_SOURCE = hansonData.source;
export const RECORD_SOURCE_URL = hansonData.sourceUrl;

/** Every policy she has cast a vote on, worst agreement first. */
export const ALL_POSITIONS: VoteRow[] = hansonData.positions.flatMap((p) =>
  typeof p.agreement === "number"
    ? [{ tvfyId: p.tvfyId, policy: p.policy, agreement: p.agreement }]
    : [],
);

/**
 * The rows that print. Chosen editorially — one or two per chapter theme,
 * picked for how squarely they sit on the booklet's subjects — rather than by
 * score, so the appendix cannot be accused of cherry-picking extremes. Listed
 * by TVFY policy id so the selection is auditable; anything missing from a
 * fresh snapshot is skipped rather than silently replaced.
 */
const APPENDIX_POLICY_IDS = [
  148, // getting rid of Sunday and public holiday penalty rates
  6, // increasing trade unions' powers in the workplace
  72, // decreasing the gender pay gap
  24, // increasing Aboriginal land rights
  309, // implementing the Uluru Statement from the Heart in full
  56, // decreasing ABC and SBS funding
  68, // increasing the diversity of media ownership
];

export const VOTES: VoteRow[] = APPENDIX_POLICY_IDS.map((id) =>
  ALL_POSITIONS.find((p) => p.tvfyId === id),
).filter((row): row is VoteRow => row !== undefined);

export type PageType =
  | "cover"
  | "blank"
  | "text"
  | "contents"
  | "chapter"
  | "quote"
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
  quote?: string;
  cite?: string;
  placeholder?: boolean;
  note?: string;
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

  CHAPTERS.forEach((chapter, index) => {
    pages.push({
      type: "chapter",
      n: index + 1,
      short: chapter.short,
      heading: chapter.heading,
      body: chapter.body,
    });
    chapter.quotes.forEach((q) => {
      pages.push({
        type: "quote",
        short: chapter.short,
        kicker: chapter.short,
        quote: q.quote,
        cite: q.cite,
        placeholder: true,
      });
    });
  });

  pages.push({
    type: "table",
    heading: "The voting record",
    note: `Per cent of relevant divisions in which she voted in favour. Source: ${RECORD_SOURCE}; policy numbers are theirs. She has attended ${MEMBER.votesAttended?.toLocaleString()} of ${MEMBER.votesPossible?.toLocaleString()} divisions.`,
  });

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
})).filter((entry) => entry.page.type === "chapter");

/** The pages that make it into the 105 × 148 mm print booklet. */
export const PRINT_PAGES = PAGES.filter(
  (p) => p.type === "quote" || p.type === "text" || p.type === "chapter",
).map((p) => ({
  kicker: p.kicker || `Chapter ${p.n ?? ""}`,
  heading: p.type === "quote" ? p.quote ?? "" : p.heading ?? "",
  body: p.type === "quote" ? "" : p.body ?? "",
  cite: p.cite ?? "",
}));
