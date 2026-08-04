"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

import { bookConfig, type BookConfig } from "@/lib/config";
import { CHAPTER_STARTS, PAGES, type Page } from "@/lib/content";
import BookPage, { BLANK_PAGE, type PageView } from "./BookPage";
import styles from "./Book.module.css";

/* The book is laid out in a fixed 380 × 570 coordinate space and then scaled
   to fit the viewport, so every offset below is in "page units", not pixels. */
const PAGE_W = 380;
const PAGE_H = 570;
const SPREAD_W = 774; // two leaves plus the gutter
const SINGLE_W = 394;
const ASIDE_W = 268; // aside plus the gap it sits behind
const BASE_DURATION = 780;
const WIDE_BREAKPOINT = 860;
const STORAGE_KEY = "lob-page";

/** Highest printed folio — the trailing blank is never shown, so it does not count. */
const LAST_FOLIO = PAGES.filter((p) => p.type !== "blank").at(-1)?.folio ?? "";

interface BookState {
  /** Index of the page currently on the right. */
  i: number;
  /** 0 idle, 1 turning forward, -1 turning back. */
  turning: number;
  /** Where the turn in flight lands. */
  target: number;
  /** Duration of the turn in flight — shortens as you rattle through. */
  dur: number;
  /** Bumped per turn so a re-fired animation restarts. */
  seq: number;
  drag: boolean;
  /** Leaf progress, 0 (flat right) to 1 (flat left). */
  p: number;
  settle: "commit" | "cancel" | null;
  immersive: boolean;
  wide: boolean;
  vh: number;
  vw: number;
  forceSingle: boolean;
}

const INITIAL_STATE: BookState = {
  i: 0,
  turning: 0,
  target: 0,
  dur: BASE_DURATION,
  seq: 0,
  drag: false,
  p: 0,
  settle: null,
  immersive: false,
  wide: true,
  vh: 900,
  vw: 1400,
  forceSingle: false,
};

const isSpread = (s: BookState) => s.wide && !s.forceSingle;

/**
 * Blank leaves exist so the spread falls the way a bound book does — an empty
 * inside cover, an empty verso facing chapter one. Single-page mode has no
 * spread to align, so it steps straight over them rather than showing the
 * reader an empty screen.
 */
function skipBlanks(t: number, dir: number, spread: boolean): number {
  if (spread) return t;
  const step = dir > 0 ? 1 : -1;
  let n = t;
  while (n > 0 && n < PAGES.length && PAGES[n].type === "blank") n += step;
  if (n >= PAGES.length) {
    // Walked off the end into the trailing blank; settle on the last real page.
    n = PAGES.length - 1;
    while (n > 0 && PAGES[n].type === "blank") n -= 1;
  }
  return n;
}

function persist(n: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(n));
  } catch {
    // Private browsing, quota, whatever — losing the bookmark is not fatal.
  }
}

export default function Book({ config = bookConfig }: { config?: BookConfig }) {
  /* State lives in a ref and renders are forced manually. The pointer handlers
     and the commit timer all read the very latest values mid-gesture, which a
     batched useState snapshot cannot promise. */
  const stateRef = useRef<BookState>(INITIAL_STATE);
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const setState = useCallback(
    (patch: Partial<BookState> | ((s: BookState) => Partial<BookState>)) => {
      const next = typeof patch === "function" ? patch(stateRef.current) : patch;
      stateRef.current = { ...stateRef.current, ...next };
      forceRender();
    },
    [],
  );
  const state = stateRef.current;

  const lastTurnAt = useRef(0);
  const streak = useRef(0);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);
  const dragRef = useRef<{ dir: number; x0: number; w: number; moved: boolean } | null>(null);
  const moveHandler = useRef<((e: PointerEvent) => void) | null>(null);
  const upHandler = useRef<(() => void) | null>(null);
  /** Latest render scale, so a drag can translate pixels into leaf progress. */
  const scaleRef = useRef(1);

  /** Turn one leaf (single) or one spread (two-up) in `dir`. */
  const turn = useCallback(
    (dir: number) => {
      const s = stateRef.current;
      if (s.drag) return;
      const spread = isSpread(s);
      // Chain off the in-flight target so held arrow keys keep moving.
      const base = s.turning ? s.target : s.i;
      const step = spread ? (base === 0 && dir > 0 ? 1 : 2) : 1;
      let t = base + dir * step;
      // Spreads always land on an even index: verso on the left, recto on the right.
      if (spread && t > 0 && t % 2 === 1) t = dir > 0 ? t + 1 : t - 1;
      t = skipBlanks(t, dir, spread);
      if (t < 0) t = 0;
      if (t >= PAGES.length || t === base) return;

      // Turns fired in quick succession get progressively snappier.
      const now = Date.now();
      streak.current = now - lastTurnAt.current < 700 ? Math.min(streak.current + 1, 7) : 0;
      lastTurnAt.current = now;
      const dur = Math.max(150, Math.round(BASE_DURATION / (1 + streak.current * 0.62)));

      if (commitTimer.current) clearTimeout(commitTimer.current);
      seqRef.current += 1;
      setState({
        i: base,
        turning: dir,
        target: t,
        dur,
        seq: seqRef.current,
        settle: null,
        p: dir > 0 ? 0 : 1,
      });
      commitTimer.current = setTimeout(() => {
        persist(t);
        commitTimer.current = null;
        setState({ i: t, turning: 0 });
      }, dur);
    },
    [setState],
  );

  const nextIndex = (s: BookState, dir: number): number | null => {
    const spread = isSpread(s);
    const step = spread ? (s.i === 0 && dir > 0 ? 1 : 2) : 1;
    let t = s.i + dir * step;
    if (spread && t > 0 && t % 2 === 1) t = dir > 0 ? t + 1 : t - 1;
    t = skipBlanks(t, dir, spread);
    if (t < 0 || t >= PAGES.length || t === s.i) return null;
    return t;
  };

  /** Scrub the leaf under the pointer. A click without movement just commits. */
  const startDrag = useCallback(
    (dir: number, e: ReactPointerEvent<HTMLDivElement>) => {
      const s = stateRef.current;
      if (s.turning || s.drag) {
        turn(dir);
        return;
      }
      const t = nextIndex(s, dir);
      if (t === null) return;

      dragRef.current = { dir, x0: e.clientX, w: PAGE_W * (scaleRef.current || 1), moved: false };
      setState({ turning: dir, target: t, drag: true, p: dir > 0 ? 0 : 1, settle: null });

      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        const dx = ev.clientX - d.x0;
        if (Math.abs(dx) > 5) d.moved = true;
        const raw = d.dir > 0 ? -dx / d.w : dx / d.w;
        setState({ p: Math.max(0, Math.min(1, d.dir > 0 ? raw : 1 - raw)) });
      };

      const onUp = () => {
        const d = dragRef.current;
        if (!d) return;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        moveHandler.current = null;
        upHandler.current = null;
        dragRef.current = null;

        const p = stateRef.current.p;
        const past = d.dir > 0 ? p > 0.28 : p < 0.72;
        const commit = d.moved ? past : true;
        setState({ drag: false, settle: commit ? "commit" : "cancel" });

        settleTimer.current = setTimeout(
          () => {
            if (commit) {
              persist(stateRef.current.target);
              setState({ i: stateRef.current.target });
            }
            setState({ turning: 0, settle: null, p: 0 });
            settleTimer.current = null;
          },
          commit ? 380 : 300,
        );
      };

      moveHandler.current = onMove;
      upHandler.current = onUp;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [setState, turn],
  );

  const goTo = useCallback(
    (n: number) => {
      const s = stateRef.current;
      if (s.turning) return;
      const t = isSpread(s) && n > 0 && n % 2 === 1 ? n + 1 : n;
      persist(t);
      setState({ i: t });
    },
    [setState],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Leave Space alone when it is about to activate a focused control.
      const onControl = !!target?.closest?.("button, a, input, textarea, select");
      if (e.key === "ArrowRight" || (e.key === " " && !onControl)) {
        e.preventDefault();
        turn(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        turn(-1);
      } else if (e.key === "Escape" && stateRef.current.immersive) {
        setState({ immersive: false });
      }
    };
    const onResize = () =>
      setState({
        wide: window.innerWidth >= WIDE_BREAKPOINT,
        vh: window.innerHeight,
        vw: window.innerWidth,
      });

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    onResize();

    const saved = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
    if (saved > 0 && saved < PAGES.length) setState({ i: saved });

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      if (moveHandler.current) window.removeEventListener("pointermove", moveHandler.current);
      if (upHandler.current) window.removeEventListener("pointerup", upHandler.current);
      if (commitTimer.current) clearTimeout(commitTimer.current);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [setState, turn]);

  /** Flatten a page into everything a leaf needs to draw itself. */
  const decorate = useCallback(
    (p: Page | null): PageView => {
      if (!p || p.type === "blank") return { ...BLANK_PAGE, coverColor: config.coverColor };
      const long = (p.quote ?? "").length > 150;
      return {
        isBlank: false,
        isCover: p.type === "cover",
        isQuote: p.type === "quote",
        isText: p.type === "text",
        isChapter: p.type === "chapter",
        isContents: p.type === "contents",
        isTable: p.type === "table",
        isBack: p.type === "back",
        isSection: p.type === "section",
        isAuthor: p.type === "author",
        lead: p.lead,
        chapterNumber: p.n,
        heading: p.heading,
        body: p.body,
        body2: p.body2,
        kicker: p.kicker,
        quote: p.quote,
        cite: p.cite,
        chapterShort: p.short,
        folio: p.folio,
        isPlaceholder: !!p.placeholder && config.showPlaceholderTags,
        quoteFontSize: long ? 19 : 24,
        coverColor: config.coverColor,
        campaignLabel: config.campaignLabel,
        campaignUrl: config.campaignUrl,
        disclaimer: config.disclaimer,
        band: p.band,
        rows: p.rows ?? [],
        continued: !!p.continued,
        tableNote: p.note,
        toc: CHAPTER_STARTS.map(({ page, index }) => ({
          n: page.n,
          // "About the author" reads better in a contents list than her name.
          title: (page.type === "author" ? page.kicker : page.heading) ?? "",
          page: index,
          go: () => goTo(index),
        })),
      };
    },
    [config, goTo],
  );

  /* ── Derived render state ─────────────────────────────────────────────── */

  const i = Math.min(state.i, PAGES.length - 1);
  const { immersive, turning, target } = state;
  const spread = isSpread(state);
  const fwd = turning > 0;
  const at = (n: number): Page | null => (n >= 0 && n < PAGES.length ? PAGES[n] : null);

  // Which page sits in each of the four slots: the two flat halves, and the
  // two faces of the leaf mid-flight.
  /* Both covers stand alone, on opposite sides. The front cover is the recto of
     leaf one, so a closed book shows it on the right with nothing facing it.
     The back cover is the verso of the last leaf, so the same leftward fold
     lands it on the left with nothing facing it. The trailing page exists only
     to give that leaf a recto; `recto` keeps it off screen. */
  const lastIndex = PAGES.length - 1;
  const recto = (n: number) => (spread && n === lastIndex ? null : at(n));

  let right = recto(i);
  let left = spread && i > 0 ? at(i - 1) : null;
  let front: Page | null = null;
  let back: Page | null = null;
  if (turning) {
    if (fwd) {
      right = recto(target);
      left = spread && i > 0 ? at(i - 1) : null;
      front = at(i);
      back = spread ? at(target - 1) : null;
    } else {
      right = recto(i);
      left = spread ? at(target - 1) : null;
      front = at(target);
      back = spread ? at(i - 1) : null;
    }
  }

  const { drag, settle, p: prog } = state;
  const live = drag || !!settle;
  const dur = state.dur || BASE_DURATION;
  const alt = state.seq % 2 === 1;
  const anim = ` ${dur}ms cubic-bezier(.33,.03,.28,1) forwards`;
  const lin = ` ${dur}ms linear forwards`;

  /* Geometry follows where the turn is heading, not where it started, so the
     book widens while the front cover is still swinging open and narrows while
     the back cover is still folding over — rather than snapping once the turn
     lands. Page content still follows the current index.

     Each half opens independently: the verso is shut against the front cover
     and the recto is shut against the back one, which is what makes the two
     ends mirror each other. */
  const geom = turning ? target : i;
  const leftOpen = spread && geom > 0;
  const rightOpen = !spread || geom < lastIndex;
  const twoUp = leftOpen && rightOpen;
  const leafRadius = twoUp ? "4px 14px 14px 4px" : "14px";

  const bookW = spread ? SPREAD_W : SINGLE_W;
  const availW = state.vw - 48 - (immersive || !state.wide ? 0 : ASIDE_W);
  const barH = immersive ? 78 : 0;
  const scale = immersive
    ? Math.max(0.4, Math.min(1.6, (state.vh - 96 - barH) / PAGE_H, (state.vw - 60) / bookW))
    : Math.max(0.4, Math.min(1, (state.vh - 72 - barH) / PAGE_H, availW / bookW));
  scaleRef.current = scale;

  /* The stage reserves the whole row, spread width included, even while the
     verso is still collapsed — otherwise the closed book overhangs the aside. */
  const stageStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    transition: "width 420ms cubic-bezier(.2,.7,.3,1), height 320ms ease",
    width: Math.round(bookW * scale),
    height: Math.round(PAGE_H * scale),
  };

  const bookRowStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: bookW,
    height: PAGE_H,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
    perspective: "2000px",
    perspectiveOrigin: "50% 42%",
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    transition: "transform 320ms cubic-bezier(.2,.7,.3,1)",
    filter: "drop-shadow(0 26px 44px rgba(0,0,0,0.55)) drop-shadow(0 3px 6px rgba(0,0,0,0.4))",
  };

  const SLIDE = "420ms cubic-bezier(.2,.7,.3,1)";

  const leftSlotStyle: CSSProperties = {
    position: "relative",
    height: PAGE_H,
    flex: "none",
    overflow: "hidden",
    transformStyle: "preserve-3d",
    transition: `width ${SLIDE}`,
    width: leftOpen ? PAGE_W : 0,
  };

  /* The right slot cannot clip its own overflow — the leaf rotates out of it,
     past the spine — so the width lives here and the clipping lives on the
     inner wrapper, with the paper anchored to the spine at a fixed width. */
  const rightSlotStyle: CSSProperties = {
    position: "relative",
    height: PAGE_H,
    flex: "none",
    transformStyle: "preserve-3d",
    transition: `width ${SLIDE}`,
    width: rightOpen ? PAGE_W : 0,
  };

  const rightClipStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
  };

  const rightPaperStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: PAGE_W,
    height: PAGE_H,
    overflow: "hidden",
    background: "#fff",
    backfaceVisibility: "hidden",
    borderRadius: twoUp ? "4px 14px 14px 4px" : "14px",
  };

  /* The lone back cover is a left page with no spine crowding it, so it takes
     the full radius and the soft edge, exactly as the lone front cover does. */
  const leftPaperStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: "#fff",
    borderRadius: twoUp ? "14px 4px 4px 14px" : "14px",
  };

  const leftShadeStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    transition: "background 320ms ease",
    background: `linear-gradient(90deg,rgba(0,0,0,0.10) 0%,rgba(0,0,0,0) ${
      twoUp ? "9%,rgba(0,0,0,0) 82%,rgba(0,0,0,0.14) 97%,rgba(0,0,0,0.34)" : "12%,rgba(0,0,0,0) 88%,rgba(0,0,0,0.10)"
    } 100%)`,
  };

  const rightShadeStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    transition: "background 320ms ease",
    background: `linear-gradient(90deg,${
      twoUp
        ? "rgba(0,0,0,0.34) 0%,rgba(0,0,0,0.14) 3%,rgba(0,0,0,0) 18%"
        : "rgba(0,0,0,0.10) 0%,rgba(0,0,0,0) 12%"
    },rgba(0,0,0,0) 88%,rgba(0,0,0,0.10) 100%)`,
  };

  /* Where the halves actually meet. The row centres whatever is open, so the
     spine slides as a half opens or shuts — it is only at the row's midpoint
     when both halves are out. Anything that lives at the spine has to follow. */
  const openW = (leftOpen ? PAGE_W : 0) + (rightOpen ? PAGE_W : 0);
  const rowLeft = (bookW - openW) / 2;
  const spineX = rowLeft + (leftOpen ? PAGE_W : 0);

  /* The gutter is a valley between two leaves, so it has no business existing
     until there are two. It tracks the spine, and widens out of a hairline as
     the book unfurls, on the same timing as the halves — rather than switching
     on once they have finished moving. */
  const gutterStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: spineX,
    width: 26,
    transform: `translateX(-50%) scaleX(${twoUp ? 1 : 0.12})`,
    pointerEvents: "none",
    zIndex: 4,
    transition: `opacity ${SLIDE}, transform ${SLIDE}, left ${SLIDE}`,
    opacity: twoUp ? 1 : 0,
    background:
      "linear-gradient(90deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.30) 42%,rgba(0,0,0,0.5) 50%,rgba(0,0,0,0.30) 58%,rgba(0,0,0,0) 100%)",
  };

  /* The block of leaves under each half. Thickness is the honest one — what you
     have read stacked left, what is left stacked right — so the depth crosses
     from one side to the other as you work through, and each cover closes
     against a full block.

     Drawn as a staircase of box-shadows behind the page: one copy of the page
     box per sheet, stepping outward and down, alternating stock and edge so it
     striates like a cut block. The layer count is fixed and only the step
     scales, which is what lets the depth animate — a shadow list can only
     interpolate against another list of the same length. */
  const BLOCK_LAYERS = 16;
  const BLOCK_DEPTH = 17;
  const readFrac = Math.min(1, Math.max(0, geom / lastIndex));
  const depth = { left: BLOCK_DEPTH * readFrac, right: BLOCK_DEPTH * (1 - readFrac) };

  const blockShadow = (thickness: number, out: 1 | -1) => {
    const step = thickness / BLOCK_LAYERS;
    const layers: string[] = [];
    for (let n = 1; n <= BLOCK_LAYERS; n += 1) {
      const x = (step * n * out).toFixed(2);
      // The block is seen slightly from above, so it also drops away downward.
      const y = (step * n * 0.5).toFixed(2);
      layers.push(`${x}px ${y}px 0 ${n % 2 ? "#cfcdc7" : "#f6f5f1"}`);
    }
    // Grounds the whole block rather than each sheet.
    layers.push(`${(thickness * out).toFixed(2)}px ${(thickness * 0.5 + 2).toFixed(2)}px 6px rgba(0,0,0,0.34)`);
    return layers.join(",");
  };

  /* Hinged at the spine and collapsed to nothing when its half is shut, in step
     with the slot it sits under. A block that kept its full width and merely
     faded would be a page-sized panel behind a half-open book — which is what a
     closing cover used to slide across. There is no ground behind the book. */
  const blockStyle = (side: "left" | "right"): CSSProperties => {
    /* Keyed to whether that half actually holds a page, not to whether the
       layout has opened for one. Opening the front cover widens the left half
       before the cover has landed in it, and a block that followed the layout
       would put a slab of paper on the table under a cover still in the air.
       Nothing is lost at either end: the block is a fraction of a sheet thick
       on the first spread and on the last, so it has nothing to pop from. */
    const open = side === "left" ? left !== null : right !== null;
    const width = open ? PAGE_W : 0;
    return {
      position: "absolute",
      top: 0,
      left: side === "left" ? spineX - width : spineX,
      width,
      height: PAGE_H,
      // Tree order puts these behind the slots, which sit at z-index auto.
      zIndex: 0,
      pointerEvents: "none",
      background: "#f6f5f1",
      borderRadius: side === "left" ? "14px 4px 4px 14px" : "4px 14px 14px 4px",
      boxShadow: blockShadow(open ? depth[side] : 0, side === "left" ? -1 : 1),
      transition: `left ${SLIDE}, width ${SLIDE}, box-shadow ${SLIDE}`,
    };
  };

  /* The leaf: dragged transforms are set directly, released ones are handed to
     a transition, and untouched ones run the keyframe animation. */
  const leafStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: PAGE_W,
    height: PAGE_H,
    transformStyle: "preserve-3d",
    transformOrigin: "left center",
    zIndex: 7,
    willChange: "transform",
  };
  if (drag) {
    leafStyle.transform = `rotateY(${(-180 * prog).toFixed(2)}deg)`;
    leafStyle.transition = "none";
  } else if (settle) {
    const end = settle === "commit" ? (fwd ? 1 : 0) : fwd ? 0 : 1;
    leafStyle.transform = `rotateY(${(-180 * end).toFixed(2)}deg)`;
    leafStyle.transition = `transform ${settle === "commit" ? 380 : 300}ms cubic-bezier(.22,.7,.3,1)`;
  } else {
    const name = fwd ? (alt ? "leafFwdB" : "leafFwd") : alt ? "leafBwdB" : "leafBwd";
    // Single-page mode has nothing behind the leaf, so it fades as it goes.
    leafStyle.animation =
      `${name}${anim}` + (twoUp ? "" : `, ${fwd ? "leafFadeOut" : "leafFadeIn"}${lin}`);
  }

  const leafFrontStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    background: "#fff",
    backfaceVisibility: "hidden",
    borderRadius: leafRadius,
    boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
  };

  const leafBackStyle: CSSProperties = {
    ...leafFrontStyle,
    transform: "rotateY(180deg)",
    borderRadius: twoUp ? "14px 4px 4px 14px" : "14px",
  };

  const frontShadeStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: "linear-gradient(90deg,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.5) 45%,rgba(0,0,0,0.22) 100%)",
    ...(live
      ? {
          opacity: Number((0.44 * Math.sin(Math.PI * Math.min(prog, 0.999))).toFixed(3)),
          transition: "opacity 260ms linear",
        }
      : { opacity: 0, animation: `frontShade${lin}` }),
  };

  const backShadeStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background: "linear-gradient(90deg,rgba(0,0,0,0.22) 0%,rgba(0,0,0,0.5) 55%,rgba(0,0,0,0.9) 100%)",
    ...(live
      ? { opacity: Number((0.5 * (1 - prog)).toFixed(3)), transition: "opacity 260ms linear" }
      : { opacity: 0, animation: `backShade${lin}` }),
  };

  /* Specular highlight per leaf face. A face reads brightest head-on and dies
     away as it turns edge-on, which is just |cos| of the rotation. Both faces
     are pinned at the ends to the gloss the flat page already carries, so a
     committed turn does not step the lighting. */
  const settleEnd = settle === "commit" ? (fwd ? 1 : 0) : fwd ? 0 : 1;
  const settleMs = settle === "commit" ? 380 : 300;
  const glossStyle = (face: "front" | "back"): CSSProperties => {
    const lit = (at: number) => {
      const facing = Math.cos(Math.PI * at);
      return Math.max(0, face === "front" ? facing : -facing);
    };
    if (drag) return { opacity: lit(prog) };
    if (settle) {
      return {
        opacity: lit(settleEnd),
        transition: `opacity ${settleMs}ms cubic-bezier(.22,.7,.3,1)`,
      };
    }
    // Whichever face is rotating away dims; the other one arrives.
    const leaving = face === "front" ? fwd : !fwd;
    return {
      opacity: leaving ? 1 : 0,
      animationName: leaving ? "glossOut" : "glossIn",
      animationDuration: `${dur}ms`,
      animationTimingFunction: "cubic-bezier(.33,.03,.28,1)",
      animationFillMode: "forwards",
    };
  };

  /* The shadow the lifting leaf throws across the page underneath. */
  const castStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: PAGE_W,
    height: PAGE_H,
    zIndex: 5,
    pointerEvents: "none",
    transformOrigin: "left center",
    borderRadius: leafRadius,
    background: "linear-gradient(90deg,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.25) 45%,rgba(0,0,0,0) 78%)",
    ...(live
      ? {
          opacity: Number((0.4 * (1 - prog)).toFixed(3)),
          transform: `scaleX(${(1 - prog * 0.9).toFixed(3)})`,
          transition: "opacity 260ms linear, transform 260ms linear",
        }
      : { opacity: 0, animation: `${fwd ? "castFwd" : "castBwd"}${lin}` }),
  };

  // Built from the folios actually on screen, so either cover reads as one page.
  const folios = [left?.folio, right?.folio].filter(Boolean);
  const counter = folios.length ? `${folios.join("–")} / ${LAST_FOLIO}` : "Cover";
  const progress = Math.round((i / (PAGES.length - 1)) * 100);
  const spreadLabel = !state.wide ? "Too narrow" : spread ? "1 page" : "2 pages";

  const prevButton = (
    <button
      type="button"
      className={`btn btn-secondary btn-icon ${styles.navBtn}`}
      onClick={() => turn(-1)}
      aria-label="Previous page"
    >
      &#8249;
    </button>
  );
  const nextButton = (
    <button
      type="button"
      className={`btn btn-secondary btn-icon ${styles.navBtn}`}
      onClick={() => turn(1)}
      aria-label="Next page"
    >
      &#8250;
    </button>
  );

  return (
    <div className={`screenonly ${styles.root}`}>
      <div className={styles.glow} aria-hidden="true">
        <div className={styles.glowTop} />
        <div className={styles.glowBottom} />
      </div>

      <div
        className={`${styles.dim} ${immersive ? styles.dimOn : styles.dimOff}`}
        aria-hidden="true"
      />

      <div className={styles.layout}>
        <div className={styles.column}>
          <div style={stageStyle}>
            <div style={bookRowStyle}>
              {/* Behind the leaves, so the blocks read as what the pages sit on. */}
              <div style={blockStyle("left")} />
              <div style={blockStyle("right")} />

              {/* No page, no paper. Opening the front cover widens this half
                  before there is anything to put in it, and a blank leaf would
                  paint a white panel sliding out from the spine — a sheet that
                  does not exist in a book you are only just opening. The leaf's
                  own back face is what lands here, and it carries the same
                  page, so nothing pops when it does. */}
              <div style={leftSlotStyle}>
                {left && (
                  <div className={styles.leftLeaf}>
                    <div className={styles.leafInner}>
                      <div style={leftPaperStyle}>
                        <BookPage page={decorate(left)} />
                        <div style={leftShadeStyle} />
                        <div className={styles.leftGloss} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={rightSlotStyle}>
                {right && (
                  <div style={rightClipStyle}>
                    <div style={rightPaperStyle}>
                      <BookPage page={decorate(right)} />
                      <div style={rightShadeStyle} />
                      <div className={styles.rightGloss} />
                    </div>
                  </div>
                )}

                {!!turning && (
                  <>
                    <div style={castStyle} />
                    <div key={state.seq} style={leafStyle}>
                      <div style={leafFrontStyle}>
                        <BookPage page={decorate(front)} />
                        <div style={rightShadeStyle} />
                        <div style={frontShadeStyle} />
                        <div className={styles.leafGlossFront} style={glossStyle("front")} />
                      </div>
                      <div style={leafBackStyle}>
                        <BookPage page={decorate(back)} />
                        <div style={leftShadeStyle} />
                        <div style={backShadeStyle} />
                        <div className={styles.leafGlossBack} style={glossStyle("back")} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={gutterStyle} />

              <div
                className={`${styles.dragZone} ${styles.dragPrev}`}
                onPointerDown={(e) => startDrag(-1, e)}
              />
              <div
                className={`${styles.dragZone} ${styles.dragNext}`}
                onPointerDown={(e) => startDrag(1, e)}
              />
            </div>
          </div>

          {immersive && (
            <div className={`${styles.bar} ${styles.barFloating}`}>
              {prevButton}
              <div className={`${styles.counter} ${styles.counterWide}`}>{counter}</div>
              {nextButton}
              <button
                type="button"
                className={`btn btn-ghost ${styles.readBtn}`}
                onClick={() => setState((s) => ({ immersive: !s.immersive }))}
              >
                Close
              </button>
            </div>
          )}
        </div>

        {!immersive && (
          <aside className={styles.aside}>
            <div className={styles.asideTitle}>The Little Orange Book</div>
            <div className={styles.asideBlurb}>
              A pocket booklet of on-the-record quotations. Click the right side to turn the page,
              the left to go back, or use the arrow keys.
            </div>
            <div className={styles.asideRow}>
              {prevButton}
              {nextButton}
              <div className={styles.counter}>{counter}</div>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.asideActions}>
              <button
                type="button"
                className={`btn btn-primary ${styles.primaryBtn}`}
                onClick={() => setState({ immersive: true })}
              >
                Read
              </button>
              <button
                type="button"
                className={`btn btn-secondary ${styles.secondaryBtn}`}
                onClick={() => {
                  if (stateRef.current.wide) setState((s) => ({ forceSingle: !s.forceSingle }));
                }}
                disabled={!state.wide}
              >
                {spreadLabel}
              </button>
            </div>
            <div className={styles.jumps}>
              {CHAPTER_STARTS.map(({ page, index }) => (
                <button
                  key={index}
                  type="button"
                  className={styles.jump}
                  onClick={() => goTo(index)}
                >
                  {page.short}
                </button>
              ))}
            </div>
            <div className={styles.asideNote}>{config.disclaimer}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
