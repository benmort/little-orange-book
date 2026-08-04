"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import styles from "./BookPage.module.css";

/**
 * The cover portrait. It sits still, under the design's own treatment —
 * greyscale, hard contrast, multiplied into the cover so the ink reads as part
 * of the stock. Double-click it and the Hanson → Trump → pig morph loads and
 * plays in colour.
 *
 * That treatment could not be used while the media carried its own orange
 * ground: greyscale and contrast cannot separate a ground from skin that sits
 * near it in value, so pushing one to white took the other with it and left a
 * visibly darker rectangle. With the ground keyed out there is nothing to
 * separate — the filter only ever touches the figure, and multiply lets the
 * cover's own orange through everywhere else.
 *
 * Nothing is fetched until asked for. The morph is over a megabyte and most
 * readers will never call for it, so the video mounts on the gesture rather
 * than after first paint.
 *
 * The hand-over is a cut, not a fade. Both layers are transparent, so the still
 * would show through the morph wherever the figure is narrower than Hanson —
 * her hair around the pig's head — and cross-fading two transparent layers lets
 * the ground through both at once.
 */
export default function CoverPortrait() {
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const handedOver = useRef(false);

  const arm = () => setArmed(true);

  const handOver = () => {
    // canplaythrough fires again on re-buffer and on each loop; without this
    // guard every one of them would rewind the morph.
    if (handedOver.current) return;
    const video = videoRef.current;
    if (!video) return;
    handedOver.current = true;
    video.currentTime = 0;
    video
      .play()
      .then(() => setPlaying(true))
      // Autoplay refused or decode failed — keep the still rather than a hole.
      .catch(() => setPlaying(false));
  };

  return (
    <button
      type="button"
      // Double-click for the mouse, Enter or Space for a keyboard — the gesture
      // is deliberate either way, which is also why reduced-motion does not
      // suppress it. That setting governs motion nobody asked for.
      onDoubleClick={arm}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          arm();
        }
      }}
      aria-label={playing ? "The cover portrait, morphing" : "Play the cover portrait morph"}
      title="Double-click to play"
      className={`${styles.portrait} ${playing ? styles.portraitPlaying : ""}`}
    >
      {!playing && (
        <Image
          src="/hanson-portrait.webp"
          alt="Portrait of Pauline Hanson"
          fill
          sizes="182px"
          priority
          // Served byte-exact. The optimiser's lossy re-encode shifts a large
          // flat field, and it is only 46 kB to begin with.
          unoptimized
          style={{ objectFit: "cover" }}
        />
      )}
      {armed && (
        <video
          ref={videoRef}
          className={styles.morph}
          style={{ opacity: playing ? 1 : 0 }}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onCanPlayThrough={handOver}
          onError={() => setPlaying(false)}
        >
          <source src="/hanson-morph.webm" type="video/webm" />
          <source src="/hanson-morph.mp4" type="video/mp4" />
        </video>
      )}
    </button>
  );
}
