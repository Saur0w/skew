"use client";

import React, { useRef, useEffect, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import MeshCard from "./mesh";
import {
  GALLERY_ITEMS,
  BASE_ITEMS,
  GalleryItem,
} from "@/lib/data";

interface SceneContentProps {
  velocityRef: React.MutableRefObject<number>;
  targetScrollRef: React.MutableRefObject<number>;
  currentScrollRef: React.MutableRefObject<number>;
  autoPlay: boolean;
  onSelect: (item: GalleryItem) => void;
  onHoverChange: (item: GalleryItem | null) => void;
  onActiveIndexChange: (index: number) => void;
}

function SceneContent({
  velocityRef,
  targetScrollRef,
  currentScrollRef,
  autoPlay,
  onSelect,
  onHoverChange,
  onActiveIndexChange,
}: SceneContentProps) {
  const { viewport } = useThree();

  // Load the 9 base textures
  const textureUrls = BASE_ITEMS.map((item) => item.src);
  const textures = useTexture(textureUrls);

  // Configure texture filtering
  useEffect(() => {
    textures.forEach((tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
    });
  }, [textures]);

  // Dimensions
  const isMobile = viewport.width < 7.5;
  const cardWidth = isMobile
    ? Math.min(2.8, Math.max(1.8, viewport.width * 0.36))
    : Math.min(2.5, Math.max(1.9, viewport.width * 0.165));
  const cardHeight = cardWidth * 1.38;

  // Diagonal offsets matching Figma staircase
  const stepX = cardWidth * 1.24;
  const stepY = -cardHeight * 0.68;

  const lastActiveIndex = useRef(-1);

  useFrame((_, delta) => {
    // Auto drift when enabled
    if (autoPlay) {
      targetScrollRef.current += 0.28 * delta;
    }

    // Smooth lerp
    const lerpSpeed = Math.min(1, delta * 12);
    const prevScroll = currentScrollRef.current;
    currentScrollRef.current = THREE.MathUtils.lerp(
      currentScrollRef.current,
      targetScrollRef.current,
      lerpSpeed
    );

    // Compute velocity
    const instantVelocity =
      (currentScrollRef.current - prevScroll) / Math.max(0.0001, delta);
    velocityRef.current = THREE.MathUtils.damp(
      velocityRef.current,
      instantVelocity,
      9,
      delta
    );

    // Active item index calculation
    const rawIdx = Math.round(currentScrollRef.current) % BASE_ITEMS.length;
    const activeIdx = (rawIdx + BASE_ITEMS.length) % BASE_ITEMS.length;
    if (activeIdx !== lastActiveIndex.current) {
      lastActiveIndex.current = activeIdx;
      onActiveIndexChange(activeIdx);
    }
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
            velocityRef={velocityRef}
            onSelect={onSelect}
            onHoverChange={onHoverChange}
          />
        );
      })}
    </group>
  );
}

interface SceneProps {
  autoPlay: boolean;
  onSelect: (item: GalleryItem) => void;
  onHoverChange: (item: GalleryItem | null) => void;
  onActiveIndexChange: (index: number) => void;
  targetScrollRef: React.MutableRefObject<number>;
  currentScrollRef: React.MutableRefObject<number>;
  velocityRef: React.MutableRefObject<number>;
}

export default function Scene({
  autoPlay,
  onSelect,
  onHoverChange,
  onActiveIndexChange,
  targetScrollRef,
  currentScrollRef,
  velocityRef,
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
          velocityRef={velocityRef}
          targetScrollRef={targetScrollRef}
          currentScrollRef={currentScrollRef}
          autoPlay={autoPlay}
          onSelect={onSelect}
          onHoverChange={onHoverChange}
          onActiveIndexChange={onActiveIndexChange}
        />
      </Suspense>
    </Canvas>
  );
}
