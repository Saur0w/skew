"use client";

import React, { Suspense } from "react";
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
  autoPlay: boolean;
}

function SceneContent({
  targetScrollRef,
  currentScrollRef,
  autoPlay,
}: SceneContentProps) {
  const { viewport } = useThree();

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

  useFrame((_, delta) => {
    // Subtle auto drift when enabled
    if (autoPlay) {
      targetScrollRef.current += 0.16 * delta;
    }

    // Smooth lerp for scroll position
    const lerpSpeed = Math.min(1, delta * 12);
    currentScrollRef.current = THREE.MathUtils.lerp(
      currentScrollRef.current,
      targetScrollRef.current,
      lerpSpeed
    );
  });

  return (
    <group>
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
        />
      ))}
    </group>
  );
}

interface SceneProps {
  autoPlay?: boolean;
  targetScrollRef: React.MutableRefObject<number>;
  currentScrollRef: React.MutableRefObject<number>;
}

export default function Scene({
  autoPlay = true,
  targetScrollRef,
  currentScrollRef,
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
          autoPlay={autoPlay}
        />
      </Suspense>
    </Canvas>
  );
}
