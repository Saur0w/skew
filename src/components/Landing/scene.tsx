"use client";

import React, { useEffect, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import MeshCard from "./mesh";
import { GALLERY_ITEMS, BASE_ITEMS } from "@/lib/data";

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

  // Load the 9 base textures from public/images/
  const textureUrls = BASE_ITEMS.map((item) => item.src);
  const textures = useTexture(textureUrls);

  // Configure texture filtering for optimal quality
  useEffect(() => {
    textures.forEach((tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
    });
  }, [textures]);

  // Dimensions: smaller minimal meshes (refined editorial scale)
  const isMobile = viewport.width < 7.5;
  const cardWidth = isMobile
    ? Math.min(1.4, Math.max(1.0, viewport.width * 0.24))
    : Math.min(1.3, Math.max(0.9, viewport.width * 0.082));
  const cardHeight = cardWidth * 1.38;

  // Diagonal offsets matching staircase layout
  const stepX = cardWidth * 1.25;
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
      {GALLERY_ITEMS.map((item, index) => {
        const texture = textures[item.imageIndex - 1];

        return (
          <MeshCard
            key={item.id}
            item={item}
            index={index}
            texture={texture}
            width={cardWidth}
            height={cardHeight}
            stepX={stepX}
            stepY={stepY}
            currentScrollRef={currentScrollRef}
          />
        );
      })}
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
