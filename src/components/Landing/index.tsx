"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import styles from "./style.module.scss";
import { TOTAL_ITEMS_COUNT } from "@/lib/data";

function wrap(val: number, min: number, max: number): number {
  const range = max - min;
  return ((((val - min) % range) + range) % range) + min;
}

// Dynamically import Three.js Scene to disable SSR and avoid hydration mismatch
const Scene = dynamic(() => import("./scene"), {
  ssr: false,
});

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetScrollRef = useRef(0);
  const currentScrollRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const introActiveRef = useRef(true);
  const scaleRef = useRef(0.32);

  // Interaction states: autoPlay is false because scroll stops after intro
  const [autoPlay, setAutoPlay] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [, setIsIntroComplete] = useState(false);

  // Drag tracking refs
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartScroll = useRef(0);
  const lastPointerPos = useRef({ x: 0, y: 0, time: 0 });
  const dragVelocity = useRef(0);
  const isPointerDown = useRef(false);
  const hasMovedRef = useRef(false);

  // Cancel intro sequence on any user interaction
  const cancelIntro = useCallback(() => {
    if (introActiveRef.current) {
      introActiveRef.current = false;
      setIsIntroComplete(true);
      setAutoPlay(false);
    }
  }, []);

  // Callback when the entrance animation finishes landing on the center image
  const handleIntroComplete = useCallback(() => {
    setIsIntroComplete(true);
    setAutoPlay(false); // Scroll halts completely on center image
  }, []);

  // Click on a card smoothly glides it to the exact center
  const handleSelectCard = useCallback(
    (index: number) => {
      if (hasMovedRef.current) return; // Prevent selection if user was dragging
      cancelIntro();
      scrollVelocityRef.current = 0; // Clear inertia so card glides directly into center
      const halfCount = TOTAL_ITEMS_COUNT / 2;
      const current = currentScrollRef.current;
      const diff = wrap(index - current, -halfCount, halfCount);
      targetScrollRef.current = current + diff;
    },
    [cancelIntro]
  );

  // Lenis smooth scroll integration
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lenis = new Lenis({
      eventsTarget: window,
      smoothWheel: true,
      syncTouch: false, // Let our pointer gestures handle touch drag directly
      wheelMultiplier: 1.0,
      autoRaf: true,
    });

    if (typeof window !== "undefined") {
      (window as unknown as { lenis?: Lenis }).lenis = lenis;
    }

    lenis.on("virtual-scroll", (e: { deltaX: number; deltaY: number }) => {
      if (isPointerDown.current) return;
      cancelIntro();

      // Normalize delta across operating systems & input devices:
      // Lenis automatically normalizes deltaMode (lines, pixels, pages)
      const rawDelta = (e.deltaY * 0.0012) + (e.deltaX * 0.0006);

      // Accumulate smooth momentum impulse into rolling velocity (Lenis physics)
      scrollVelocityRef.current += rawDelta * 7.5;
    });

    return () => {
      lenis.destroy();
      if (typeof window !== "undefined") {
        delete (window as unknown as { lenis?: Lenis }).lenis;
      }
    };
  }, [cancelIntro]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        cancelIntro();
        scrollVelocityRef.current = 0;
        targetScrollRef.current = Math.round(targetScrollRef.current) + 1;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        cancelIntro();
        scrollVelocityRef.current = 0;
        targetScrollRef.current = Math.round(targetScrollRef.current) - 1;
      } else if (e.key === " ") {
        cancelIntro();
        setAutoPlay((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelIntro]);

  // Pointer drag gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    cancelIntro();
    isPointerDown.current = true;
    hasMovedRef.current = false;
    setIsDragging(true);
    scrollVelocityRef.current = 0; // Halt coasting on direct touch
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartScroll.current = targetScrollRef.current;
    lastPointerPos.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    dragVelocity.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
    }

    // Moving pointer towards top-left (dx < 0, dy < 0) advances the stream along diagonal
    const dragDelta = -(dx + dy) * 0.0016;
    targetScrollRef.current = dragStartScroll.current + dragDelta;

    // Track fling momentum
    const now = performance.now();
    const dt = Math.max(1, now - lastPointerPos.current.time);
    const instantVx = -(e.clientX - lastPointerPos.current.x) / dt;
    const instantVy = -(e.clientY - lastPointerPos.current.y) / dt;
    dragVelocity.current = (instantVx + instantVy) * 0.5;

    lastPointerPos.current = { x: e.clientX, y: e.clientY, time: now };
  };

  const handlePointerUp = () => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    setIsDragging(false);

    // Transfer drag fling momentum directly into scrollVelocityRef
    if (Math.abs(dragVelocity.current) > 0.02) {
      scrollVelocityRef.current = dragVelocity.current * 1.8;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.landing} ${isDragging ? styles.isDragging : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Minimal 3D WebGL Canvas */}
      <div className={styles.canvasContainer}>
        <Scene
          autoPlay={autoPlay}
          targetScrollRef={targetScrollRef}
          currentScrollRef={currentScrollRef}
          scrollVelocityRef={scrollVelocityRef}
          introActiveRef={introActiveRef}
          scaleRef={scaleRef}
          onIntroComplete={handleIntroComplete}
          onSelectCard={handleSelectCard}
        />
      </div>

      {/* Vintage border vignette overlay */}
      <div className={styles.vignetteOverlay} />
    </div>
  );
}