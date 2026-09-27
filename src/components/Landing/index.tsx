"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import styles from "./style.module.scss";
import { BASE_ITEMS, GalleryItem } from "@/lib/data";

// Dynamically import Three.js Scene to disable SSR and avoid hydration mismatch
const Scene = dynamic(() => import("./scene"), {
  ssr: false,
});

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetScrollRef = useRef(0);
  const currentScrollRef = useRef(0);
  const velocityRef = useRef(0);

  // Interaction states
  const [autoPlay, setAutoPlay] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<GalleryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
      // Trackpad or mouse wheel: combine deltaY and deltaX
      const delta = (e.deltaY * 0.0022) + (e.deltaX * 0.001);
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
      if (selectedItem) {
        if (e.key === "Escape") {
          setSelectedItem(null);
        }
        return;
      }

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
  }, [selectedItem]);

  // Pointer drag gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    if (selectedItem) return;
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

    // Dragging along the diagonal:
    // Moving pointer towards top-left (dx < 0, dy < 0) advances the stream
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

  const handleNext = () => {
    targetScrollRef.current = Math.round(targetScrollRef.current) + 1;
  };

  const handlePrev = () => {
    targetScrollRef.current = Math.round(targetScrollRef.current) - 1;
  };

  const activeItem = BASE_ITEMS[activeIndex] || BASE_ITEMS[0];

  return (
    <div
      ref={containerRef}
      className={`${styles.landing} ${isDragging ? styles.isDragging : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 3D WebGL Canvas */}
      <div className={styles.canvasContainer}>
        <Scene
          autoPlay={autoPlay}
          onSelect={setSelectedItem}
          onHoverChange={setHoveredItem}
          onActiveIndexChange={setActiveIndex}
          targetScrollRef={targetScrollRef}
          currentScrollRef={currentScrollRef}
          velocityRef={velocityRef}
        />
      </div>

      {/* Editorial Header */}
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <span className={styles.logo}>SKEW</span>
          <span className={styles.tagline}>Diagonal Infinite Stream</span>
        </div>

        <div className={styles.activeIndicator}>
          <div className={styles.counter}>
            <span>{String(activeIndex + 1).padStart(2, "0")}</span>
            <span className={styles.total}>/ {String(BASE_ITEMS.length).padStart(2, "0")}</span>
          </div>
          <span className={styles.activeTitle}>{activeItem.title}</span>
        </div>
      </header>

      {/* Floating Hover Indicator */}
      {hoveredItem && !selectedItem && (
        <div className={styles.hoverCard}>
          <span>{hoveredItem.title}</span>
          <span className={styles.hoverCategory}>• {hoveredItem.category}</span>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomLeft}>
          <button
            type="button"
            className={styles.autoplayBtn}
            onClick={() => setAutoPlay((prev) => !prev)}
          >
            <span
              className={`${styles.pulseDot} ${!autoPlay ? styles.inactive : ""}`}
            />
            <span>{autoPlay ? "Autoplay On" : "Autoplay Off"}</span>
          </button>

          <span className={styles.hint}>Scroll or drag diagonally</span>
        </div>

        <div className={styles.bottomRight}>
          <div className={styles.navArrows}>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={handlePrev}
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={handleNext}
              aria-label="Next image"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Detail Modal */}
      {selectedItem && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setSelectedItem(null)}
              aria-label="Close modal"
            >
              ×
            </button>

            <div className={styles.modalImageWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedItem.src} alt={selectedItem.title} />
            </div>

            <div className={styles.modalDetails}>
              <div className={styles.modalMeta}>
                <span className={styles.modalCategory}>
                  {selectedItem.category} • {selectedItem.year}
                </span>
                <h2 className={styles.modalTitle}>{selectedItem.title}</h2>
                <p className={styles.modalSubtitle}>{selectedItem.subtitle}</p>
              </div>

              <div className={styles.modalSpecs}>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Location</span>
                  <span className={styles.specValue}>{selectedItem.location}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Aspect Ratio</span>
                  <span className={styles.specValue}>Portrait (3:4)</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Projection</span>
                  <span className={styles.specValue}>Perspective Matrix</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Shader</span>
                  <span className={styles.specValue}>Dynamic Shear Skew</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}