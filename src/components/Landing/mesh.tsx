"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { GalleryItem, TOTAL_ITEMS_COUNT } from "@/lib/data";

function wrap(val: number, min: number, max: number): number {
  const range = max - min;
  return ((((val - min) % range) + range) % range) + min;
}

interface MeshCardProps {
  item: GalleryItem;
  index: number;
  texture: THREE.Texture;
  width: number;
  height: number;
  stepX: number;
  stepY: number;
  currentScrollRef: React.MutableRefObject<number>;
}

export default function MeshCard({
  item,
  index,
  texture,
  width,
  height,
  stepX,
  stepY,
  currentScrollRef,
}: MeshCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Clone texture to apply object-fit: cover mapping without any custom shaders
  const coverTexture = useMemo(() => {
    const cloned = texture.clone();
    const img = texture.image as { width?: number; height?: number } | undefined;
    if (img && img.width && img.height) {
      const imageAspect = img.width / img.height;
      const planeAspect = width / height;
      if (planeAspect > imageAspect) {
        cloned.repeat.set(1, imageAspect / planeAspect);
        cloned.offset.set(0, (1 - imageAspect / planeAspect) / 2);
      } else {
        cloned.repeat.set(planeAspect / imageAspect, 1);
        cloned.offset.set((1 - planeAspect / imageAspect) / 2, 0);
      }
    }
    cloned.needsUpdate = true;
    return cloned;
  }, [texture, width, height]);

  const halfCount = TOTAL_ITEMS_COUNT / 2;

  useFrame(() => {
    if (!meshRef.current) return;

    // Calculate wrapped diagonal coordinate
    const virtualPos = wrap(
      index - currentScrollRef.current,
      -halfCount,
      halfCount
    );

    // Flat, minimal positioning along diagonal (no distortion, no skew)
    meshRef.current.position.x = virtualPos * stepX;
    meshRef.current.position.y = virtualPos * stepY;
    meshRef.current.position.z = 0;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={coverTexture}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
