"use client";

import React, { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import MeshCard from "./mesh";
import { GALLERY_ITEMS, BASE_ITEMS } from "@/lib/data";

// Preload all textures in advance
BASE_ITEMS.forEach((item) => {
  useTexture.preload(item.src);
});

interface SceneContentProps {
  targetScrollRef: React.MutableRefObject<number>;
  currentScrollRef: React.MutableRefObject<number>;
  scrollVelocityRef: React.MutableRefObject<number>;
  introActiveRef: React.MutableRefObject<boolean>;
  scaleRef: React.MutableRefObject<number>;
  autoPlay: boolean;
  onIntroComplete?: () => void;
  onSelectCard?: (index: number) => void;
}

function SceneContent({
  targetScrollRef,
  currentScrollRef,
  scrollVelocityRef,
  introActiveRef,
  scaleRef,
  autoPlay,
  onIntroComplete,
  onSelectCard,
}: SceneContentProps) {
  const { viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const introStartTimeRef = useRef<number | null>(null);

  // Intro choreography constants
  const INTRO_DURATION = 3.0; // seconds for smooth, luxurious deceleration
  const INTRO_DISTANCE = 18.0; // exact integer items: lands precisely centered on item 0 (Celestial Drift)
  const INITIAL_SCALE = 0.32; // small miniature scale at start
  const FINAL_SCALE = 1.40; // more zoom at the end for prominent hero display

  // Pre-fetch all base textures into Drei cache so all meshes render smoothly
  const textureUrls = BASE_ITEMS.map((item) => item.src);
  useTexture(textureUrls);

  // Dimensions: subtle portrait cards (moderately more height than width)
  const isMobile = viewport.width < 7.5;
  const cardWidth = isMobile
    ? Math.min(2.2, Math.max(1.5, viewport.width * 0.33))
    : Math.min(2.35, Math.max(1.65, viewport.width * 0.14));
  // Subtle portrait aspect ratio (~4:5, ~1.22x): more height than width, not too extreme
  const cardHeight = cardWidth * 1.22;

  // Diagonal offsets matching staircase layout
  const stepX = cardWidth * 1.22;
  const stepY = -cardHeight * 0.68;

  useFrame((state, delta) => {
    if (introActiveRef.current) {
      if (introStartTimeRef.current === null) {
        introStartTimeRef.current = state.clock.elapsedTime;
      }

      const elapsed = state.clock.elapsedTime - introStartTimeRef.current;
      const progress = Math.min(1, Math.max(0, elapsed / INTRO_DURATION));

      // Scroll easing ("starting a bit slow"):
      // Starts gently (~2.7 items/s), accelerates into fast drift (~12 items/s),
      // then progressively slows down and lands smoothly on center image at progress = 1
      const e1 = 10 * Math.pow(progress, 2) - 20 * Math.pow(progress, 3) + 15 * Math.pow(progress, 4) - 4 * Math.pow(progress, 5);
      const e2 = 1 - Math.pow(1 - progress, 3);
      const scrollEase = 0.85 * e1 + 0.15 * e2;

      // Scale easing ("more zoom at the end"):
      // Stays compact during fast reel, then surges into a dramatic hero zoom as motion halts
      const scaleEase = Math.pow(progress, 1.7);
      const currentScale = INITIAL_SCALE + (FINAL_SCALE - INITIAL_SCALE) * scaleEase;
      scaleRef.current = currentScale;
      if (groupRef.current) {
        groupRef.current.scale.set(currentScale, currentScale, 1);
      }

      // Scroll position driven directly by the deceleration curve
      const currentScroll = scrollEase * INTRO_DISTANCE;
      currentScrollRef.current = currentScroll;
      targetScrollRef.current = currentScroll;

      // When deceleration reaches completion, halt scroll exactly on center image
      if (progress >= 1) {
        introActiveRef.current = false;
        currentScrollRef.current = INTRO_DISTANCE;
        targetScrollRef.current = INTRO_DISTANCE;
        scaleRef.current = FINAL_SCALE;
        if (groupRef.current) {
          groupRef.current.scale.set(FINAL_SCALE, FINAL_SCALE, 1);
        }
        onIntroComplete?.();
      }
    } else {
      // Manual scrolling mode
      // Damp scale to FINAL_SCALE in case user interrupted intro before completion
      if (scaleRef.current < FINAL_SCALE - 0.001) {
        scaleRef.current = THREE.MathUtils.damp(scaleRef.current, FINAL_SCALE, 8, delta);
        if (groupRef.current) {
          groupRef.current.scale.set(scaleRef.current, scaleRef.current, 1);
        }
      } else if (scaleRef.current !== FINAL_SCALE) {
        scaleRef.current = FINAL_SCALE;
        if (groupRef.current) {
          groupRef.current.scale.set(FINAL_SCALE, FINAL_SCALE, 1);
        }
      }

      // Apply frame-rate independent exponential friction decay to the rolling momentum
      const friction = Math.pow(0.91, Math.min(3, delta * 60));
      scrollVelocityRef.current *= friction;

      if (Math.abs(scrollVelocityRef.current) < 0.0004) {
        scrollVelocityRef.current = 0;
      }

      // Smoothly advance targetScroll by the decaying velocity
      targetScrollRef.current += scrollVelocityRef.current * delta * 5.2;

      // Subtle auto drift when explicitly re-enabled (default is off after intro)
      if (autoPlay) {
        targetScrollRef.current += 0.16 * delta;
      }

      // Lenis-style exponential damping (MathUtils.damp):
      // Smooth 5.5 lambda decay ensures velvety inertia without stiff snapping
      currentScrollRef.current = THREE.MathUtils.damp(
        currentScrollRef.current,
        targetScrollRef.current,
        5.5,
        delta
      );
    }
  });

  return (
    <group ref={groupRef} scale={[INITIAL_SCALE, INITIAL_SCALE, 1]}>
      {GALLERY_ITEMS.map((item, index) => (
        <MeshCard
          key={item.id}
          item={item}
          index={index}
          width={cardWidth}
          height={cardHeight}
          stepX={stepX}
          stepY={stepY}
          currentScrollRef={currentScrollRef}
          onSelectCard={onSelectCard}
        />
      ))}
    </group>
  );
}

interface SceneProps {
  autoPlay?: boolean;
  targetScrollRef: React.MutableRefObject<number>;
  currentScrollRef: React.MutableRefObject<number>;
  scrollVelocityRef: React.MutableRefObject<number>;
  introActiveRef: React.MutableRefObject<boolean>;
  scaleRef: React.MutableRefObject<number>;
  onIntroComplete?: () => void;
  onSelectCard?: (index: number) => void;
}

export default function Scene({
  autoPlay = false,
  targetScrollRef,
  currentScrollRef,
  scrollVelocityRef,
  introActiveRef,
  scaleRef,
  onIntroComplete,
  onSelectCard,
}: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 48 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "auto",
      }}
    >
      <Suspense fallback={null}>
        <SceneContent
          targetScrollRef={targetScrollRef}
          currentScrollRef={currentScrollRef}
          scrollVelocityRef={scrollVelocityRef}
          introActiveRef={introActiveRef}
          scaleRef={scaleRef}
          autoPlay={autoPlay}
          onIntroComplete={onIntroComplete}
          onSelectCard={onSelectCard}
        />
      </Suspense>
    </Canvas>
  );
}

