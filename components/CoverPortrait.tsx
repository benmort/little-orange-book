"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import styles from "./BookPage.module.css";

/**
 * The cover portrait. The still lands first and carries the cover on its own;
 * only once it has painted does the Hanson → Trump → pig morph start loading.
 * Readers who have asked for reduced motion keep the still.
 *
 * Neither asset carries an orange of its own: the ground is keyed out of both,
 * so what shows behind the figures is the cover's own background. That is the
 * only way to guarantee one orange — a baked-in colour has to survive
 * next/image re-encoding and the browser's video colour pipeline, and those two
 * disagree with CSS by a few levels each on a colour-managed display.
 *
 * Because both are transparent, the hand-over is a cut rather than a fade: the
 * still would otherwise show through the morph wherever the figure is narrower
 * than Hanson — her hair around the pig's head — and a cross-fade of two
 * transparent layers lets the ground through both. The video is held at frame
 * one until it can play, and frame one is exactly what the still shows, so the
 * cut lands on identical pixels.
 */
export default function CoverPortrait() {
  const [stillLoaded, setStillLoaded] = useState(false);
  const [morphReady, setMorphReady] = useState(false);
  const [allowMotion, setAllowMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAllowMotion(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const handedOver = useRef(false);
  const handOver = () => {
    // canplaythrough fires again on re-buffer and on each loop; without this
    // guard every one of them would rewind the morph to the start.
    if (handedOver.current) return;
    const video = videoRef.current;
    if (!video) return;
    handedOver.current = true;
    video.currentTime = 0;
    video
      .play()
      .then(() => setMorphReady(true))
      // Autoplay refused or decode failed — keep the still rather than a hole.
      .catch(() => setMorphReady(false));
  };

  return (
    <div className={styles.portrait}>
      {!morphReady && (
        <Image
          src="/hanson-portrait.webp"
          alt="Portrait of Pauline Hanson"
          fill
          sizes="182px"
          priority
          // Served byte-exact. The optimiser's lossy re-encode shifts a large
          // flat field of saturated orange, and it is only 46 kB to begin with.
          unoptimized
          style={{ objectFit: "cover" }}
          onLoad={() => setStillLoaded(true)}
          // A missing still must not strand the morph behind a load that never comes.
          onError={() => setStillLoaded(true)}
        />
      )}
      {stillLoaded && allowMotion && (
        <video
          ref={videoRef}
          className={styles.morph}
          style={{ opacity: morphReady ? 1 : 0 }}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onCanPlayThrough={handOver}
          onError={() => setMorphReady(false)}
        >
          <source src="/hanson-morph.webm" type="video/webm" />
          <source src="/hanson-morph.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
