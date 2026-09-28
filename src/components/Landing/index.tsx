"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import styles from "./style.module.scss";

// Dynamically import Three.js Scene to disable SSR and avoid hydration mismatch
const Scene = dynamic(() => import("./scene"), {
  ssr: false,
});

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetScrollRef = useRef(0);
  const currentScrollRef = useRef(0);

  // Interaction states
  const [autoPlay, setAutoPlay] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Drag tracking refs
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartScroll = useRef(0);
  const lastPointerPos = useRef({ x: 0, y: 0, time: 0 });
  const dragVelocity = useRef(0);
  const isPointerDown = useRef(false);

  // Wheel handling with trackpad normalization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpad or mouse wheel: combine deltaY and deltaX for natural diagonal response
      const delta = (e.deltaY * 0.002) + (e.deltaX * 0.001);
      targetScrollRef.current += delta;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        targetScrollRef.current = Math.round(targetScrollRef.current) + 1;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        targetScrollRef.current = Math.round(targetScrollRef.current) - 1;
      } else if (e.key === " ") {
        setAutoPlay((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Pointer drag gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDown.current = true;
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartScroll.current = targetScrollRef.current;
    lastPointerPos.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    dragVelocity.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

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

    // Apply inertia fling
    if (Math.abs(dragVelocity.current) > 0.05) {
      targetScrollRef.current += dragVelocity.current * 0.45;
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
        />
      </div>
    </div>
  );
}