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
  introActiveRef: React.MutableRefObject<boolean>;
  scaleRef: React.MutableRefObject<number>;
  autoPlay: boolean;
  onIntroComplete?: () => void;
  onSelectCard?: (index: number) => void;
}

function SceneContent({
  targetScrollRef,
  currentScrollRef,
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
  const INTRO_DURATION = 2.8; // seconds for smooth, luxurious deceleration
  const INTRO_DISTANCE = 18.0; // exact integer items: lands precisely centered on item 0 (Celestial Drift)
  const INITIAL_SCALE = 0.38; // initial miniature scale

  // Pre-fetch all base textures into Drei cache so all meshes render smoothly
  const textureUrls = BASE_ITEMS.map((item) => item.src);
  useTexture(textureUrls);

  // Dimensions: subtle portrait cards (moderately more height than width)
  const isMobile = viewport.width < 7.5;
  const cardWidth = isMobile
    ? Math.min(2.1, Math.max(1.4, viewport.width * 0.32))
    : Math.min(2.2, Math.max(1.6, viewport.width * 0.135));
  // Subtle portrait aspect ratio (~4:5, ~1.2x): more height than width, not too extreme
  const cardHeight = cardWidth * 1.2;

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

      // Quartic Out easing: starts at very high velocity (~25 items/sec) and smoothly glides to 0
      const scrollEase = 1 - Math.pow(1 - progress, 4);

      // Cubic Out easing for scale: smoothly blossoms from small miniature to full 1.0 size
      const scaleEase = 1 - Math.pow(1 - progress, 3);

      // Update scale on parent group (scales both card size and relative spacing seamlessly)
      const currentScale = INITIAL_SCALE + (1.0 - INITIAL_SCALE) * scaleEase;
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
        scaleRef.current = 1.0;
        if (groupRef.current) {
          groupRef.current.scale.set(1.0, 1.0, 1);
        }
        onIntroComplete?.();
      }
    } else {
      // Manual scrolling mode
      // Damp scale to 1.0 in case user interrupted intro before completion
      if (scaleRef.current < 0.999) {
        scaleRef.current = THREE.MathUtils.damp(scaleRef.current, 1.0, 10, delta);
        if (groupRef.current) {
          groupRef.current.scale.set(scaleRef.current, scaleRef.current, 1);
        }
      } else if (scaleRef.current !== 1.0) {
        scaleRef.current = 1.0;
        if (groupRef.current) {
          groupRef.current.scale.set(1.0, 1.0, 1);
        }
      }

      // Subtle auto drift when explicitly re-enabled (default is off after intro)
      if (autoPlay) {
        targetScrollRef.current += 0.16 * delta;
      }

      // Smooth lerp for manual scroll navigation
      const lerpSpeed = Math.min(1, delta * 12);
      currentScrollRef.current = THREE.MathUtils.lerp(
        currentScrollRef.current,
        targetScrollRef.current,
        lerpSpeed
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
  introActiveRef: React.MutableRefObject<boolean>;
  scaleRef: React.MutableRefObject<number>;
  onIntroComplete?: () => void;
  onSelectCard?: (index: number) => void;
}

export default function Scene({
  autoPlay = false,
  targetScrollRef,
  currentScrollRef,
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

