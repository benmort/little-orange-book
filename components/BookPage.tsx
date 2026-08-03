import type { CSSProperties } from "react";

import type { VoteRow } from "@/lib/content";
import CoverPortrait from "./CoverPortrait";
import styles from "./BookPage.module.css";

export interface TocEntry {
  n: number;
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
  chapterNumber?: number;
  heading?: string;
  body?: string;
  body2?: string;
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
  votes: VoteRow[];
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
  isPlaceholder: false,
  quoteFontSize: 24,
  coverColor: "#ff5a00",
  campaignLabel: "",
  campaignUrl: "",
  disclaimer: "",
  votes: [],
  toc: [],
};

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

      {/* The back cover mirrors the front: same ground, same keyline, same
          portrait slot, same type. The morph's punchline stands in for the
          portrait and delivers the verdict. */}
      {page.isBack && (
        <div className={styles.cover} style={accentBg}>
          <div className={styles.coverRule} />
          <div className={styles.portrait}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/pig-portrait.webp" alt="The cover portrait morphed into a pig" />
          </div>
          <div className={styles.coverTitle}>
            <div className={styles.coverName}>
              Racist
              <br />
              Pig!
            </div>
          </div>
          <div className={`${styles.coverFooter} ${styles.coverFooterUrl}`}>{page.campaignUrl}</div>
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
                <span className={styles.tocNumber}>{row.n}</span>
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
            Appendix
          </div>
          <div className={styles.tableColumn}>
            <div className={styles.tableHeading}>{page.heading}</div>
            <div className={styles.tableHead}>
              <span>Policy</span>
              <span className={styles.alignRight}>In favour</span>
            </div>
            {page.votes.map((vote) => (
              <div key={vote.tvfyId} className={styles.tableRow}>
                <span className={styles.voteBill}>
                  {vote.policy}
                  <br />
                  <span className={styles.voteYear}>Policy {vote.tvfyId}</span>
                </span>
                <span className={styles.voteValue}>{Math.round(vote.agreement)}%</span>
              </div>
            ))}
          </div>
          <div className={styles.tableNote}>{page.tableNote}</div>
        </div>
      )}

      {page.isBlank && <div className={styles.blank} />}
    </div>
  );
}
