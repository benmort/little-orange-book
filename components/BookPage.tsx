import type { CSSProperties } from "react";

import { VERDICT_GLYPH, verdictFor, type VoteRow } from "@/lib/content";
import CoverPortrait from "./CoverPortrait";
import styles from "./BookPage.module.css";

export interface TocEntry {
  /** Chapters are numbered; sections are not. */
  n?: number;
  title: string;
  page: number;
  go: () => void;
}

/**
 * A page flattened into everything the leaf needs to draw itself. The reader
 * builds one of these per visible slot (left, right, and both faces of the
 * leaf mid-turn), so this component stays a pure function of its input.
 */
export interface PageView {
  isBlank: boolean;
  isCover: boolean;
  isQuote: boolean;
  isText: boolean;
  isChapter: boolean;
  isContents: boolean;
  isTable: boolean;
  isBack: boolean;
  isSection: boolean;
  lead?: string;
  chapterNumber?: number;
  heading?: string;
  body?: string;
  body2?: string;
  body3?: string;
  kicker?: string;
  quote?: string;
  cite?: string;
  chapterShort?: string;
  folio?: string;
  isPlaceholder: boolean;
  /** Long quotations drop a step so they still fit the leaf. */
  quoteFontSize: number;
  coverColor: string;
  campaignLabel: string;
  campaignUrl: string;
  disclaimer: string;
  /** Voting-record leaves. */
  band?: string;
  rows: VoteRow[];
  continued: boolean;
  tableNote?: string;
  toc: TocEntry[];
}

export const BLANK_PAGE: PageView = {
  isBlank: true,
  isCover: false,
  isQuote: false,
  isText: false,
  isChapter: false,
  isContents: false,
  isTable: false,
  isBack: false,
  isSection: false,
  isPlaceholder: false,
  quoteFontSize: 24,
  coverColor: "#ff5a00",
  campaignLabel: "",
  campaignUrl: "",
  disclaimer: "",
  rows: [],
  continued: false,
  toc: [],
};

/** Ink weights that hold up on white stock — a bright yellow would not. */
const VERDICT_CLASS = {
  for: styles.voteFor,
  mixed: styles.voteMixed,
  against: styles.voteAgainst,
} as const;

export default function BookPage({ page }: { page: PageView }) {
  const accent: CSSProperties = { color: page.coverColor };
  const accentBg: CSSProperties = { background: page.coverColor };

  return (
    <div className={styles.page}>
      {page.isCover && (
        <div className={styles.cover} style={accentBg}>
          <div className={styles.coverRule} />
          <CoverPortrait />
          <div className={styles.coverTitle}>
            <div className={styles.coverKicker}>Quotations from</div>
            <div className={styles.coverName}>
              Pauline
              <br />
              Hanson
            </div>
          </div>
          <div className={styles.coverFooter}>In her own words</div>
        </div>
      )}

      {/* The back cover keeps the front's ground and keyline, and carries what
          a back cover is for: what to do next, and who authorised it. */}
      {page.isBack && (
        <div className={styles.back} style={accentBg}>
          <div className={styles.coverRule} />
          <div className={styles.backTop}>
            <div className={styles.backHeading}>Read it. Then talk to the person next to you.</div>
            <div className={styles.backBody}>
              Every quotation in this booklet is on the public record, and so is every vote. Check
              any of them. That is the point.
            </div>
          </div>
          <div className={styles.backCampaign}>
            <div className={styles.qr}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/campaign-qr.svg" alt={`QR code linking to ${page.campaignUrl}`} />
            </div>
            <div className={styles.campaign}>
              <div className={styles.campaignLabel}>{page.campaignLabel}</div>
              <div className={styles.campaignUrl}>{page.campaignUrl}</div>
            </div>
          </div>
          <div className={styles.backDisclaimer}>{page.disclaimer}</div>
        </div>
      )}

      {/* A section opener, set like a chapter's but unnumbered. */}
      {page.isSection && (
        <div className={styles.chapter} style={accentBg}>
          <div className={styles.chapterBar} />
          <div className={styles.chapterNumber} style={accent}>
            Section
          </div>
          <div className={styles.chapterHeading}>{page.heading}</div>
          <div className={styles.chapterDivider} />
          <div className={styles.chapterBody}>{page.body}</div>
          {page.lead && <div className={styles.sectionLead}>{page.lead}</div>}
          <div className={styles.chapterFolio}>{page.folio}</div>
        </div>
      )}


      {page.isChapter && (
        <div className={styles.chapter} style={accentBg}>
          <div className={styles.chapterBar} />
          <div className={styles.chapterNumber} style={accent}>
            Chapter {page.chapterNumber}
          </div>
          <div className={styles.chapterHeading}>{page.heading}</div>
          <div className={styles.chapterDivider} />
          <div className={styles.chapterBody}>{page.body}</div>
          <div className={styles.chapterFolio}>{page.folio}</div>
        </div>
      )}

      {page.isQuote && (
        <div className={styles.quote}>
          <div className={styles.quoteHeader}>
            <div className={styles.quoteKicker} style={accent}>
              {page.kicker}
            </div>
            {page.isPlaceholder && (
              <div className={styles.placeholderTag} style={accentBg}>
                Placeholder
              </div>
            )}
          </div>
          <div className={styles.quoteBody}>
            <div>
              <div className={styles.quoteMark} style={accent}>
                &ldquo;
              </div>
              <div className={styles.quoteText} style={{ fontSize: page.quoteFontSize }}>
                {page.quote}
              </div>
            </div>
          </div>
          <div className={styles.quoteFooter}>
            <div className={styles.quoteCite}>{page.cite}</div>
            <div className={styles.quoteMeta}>
              <span>{page.chapterShort}</span>
              <span className={styles.folio}>{page.folio}</span>
            </div>
          </div>
        </div>
      )}

      {page.isText && (
        <div className={styles.text}>
          <div className={styles.textHeader} style={accent}>
            {page.kicker}
          </div>
          <div className={styles.textColumn}>
            <div className={styles.textHeading}>{page.heading}</div>
            <div className={styles.textRule} style={accentBg} />
            <div className={styles.textParagraph}>{page.body}</div>
            <div className={styles.textParagraph}>{page.body2}</div>
            {page.body3 && <div className={styles.textParagraph}>{page.body3}</div>}
          </div>
          <div className={styles.textFolio}>{page.folio}</div>
        </div>
      )}

      {page.isContents && (
        <div className={styles.contents}>
          <div className={styles.contentsHeader} style={accent}>
            Contents
          </div>
          <div className={styles.contentsList}>
            {page.toc.map((row) => (
              <button key={row.page} type="button" className={styles.tocRow} onClick={row.go}>
                <span className={styles.tocNumber}>{row.n ?? ""}</span>
                <span>{row.title}</span>
                <span className={styles.tocLeader} />
                <span className={styles.tocPage}>{row.page}</span>
              </button>
            ))}
          </div>
          <div className={styles.contentsFolio}>{page.folio}</div>
        </div>
      )}

      {page.isTable && (
        <div className={styles.table}>
          <div className={styles.tableHeader} style={accent}>
            {page.continued ? `${page.band} — continued` : "The voting record"}
          </div>
          <div className={styles.tableColumn}>
            {page.heading && <div className={styles.tableHeading}>{page.heading}</div>}
            {/* Repeated on every leaf of a band, so a spread never shows rows
                whose heading is two pages back. */}
            <div className={styles.tableBand}>
              {page.band}
              {page.continued && <span className={styles.tableBandCont}> cont.</span>}
            </div>
            <div className={styles.tableHead}>
              <span>Policy</span>
              <span className={styles.alignRight}>In favour</span>
            </div>
            {page.rows.map((row) => (
              <div key={row.tvfyId} className={styles.tableRow}>
                <span className={styles.voteBill}>
                  {row.policy}
                  <br />
                  <span className={styles.voteYear}>Policy {row.tvfyId}</span>
                </span>
                <span className={`${styles.voteValue} ${VERDICT_CLASS[verdictFor(row.agreement)]}`}>
                  {Math.round(row.agreement)}%
                  <span className={styles.voteArrow}>{VERDICT_GLYPH[verdictFor(row.agreement)]}</span>
                </span>
              </div>
            ))}
          </div>
          <div className={styles.tableFooter}>
            {page.tableNote && <div className={styles.tableNote}>{page.tableNote}</div>}
            <div className={styles.tableFolio}>{page.folio}</div>
          </div>
        </div>
      )}

      {page.isBlank && <div className={styles.blank} />}
    </div>
  );
}
