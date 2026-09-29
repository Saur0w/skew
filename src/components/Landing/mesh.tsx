"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Image as DreiImage } from "@react-three/drei";
import { GalleryItem, TOTAL_ITEMS_COUNT } from "@/lib/data";

function wrap(val: number, min: number, max: number): number {
  const range = max - min;
  return ((((val - min) % range) + range) % range) + min;
}

interface MeshCardProps {
  item: GalleryItem;
  index: number;
  width: number;
  height: number;
  stepX: number;
  stepY: number;
  currentScrollRef: React.MutableRefObject<number>;
}

export default function MeshCard({
  item,
  index,
  width,
  height,
  stepX,
  stepY,
  currentScrollRef,
}: MeshCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const halfCount = TOTAL_ITEMS_COUNT / 2;

  useFrame(() => {
    if (!meshRef.current) return;

    // Calculate wrapped diagonal coordinate
    const virtualPos = wrap(
      index - currentScrollRef.current,
      -halfCount,
      halfCount
    );

    // Clean flat 3D positioning along diagonal
    meshRef.current.position.x = virtualPos * stepX;
    meshRef.current.position.y = virtualPos * stepY;
    meshRef.current.position.z = 0;
  });

  return (
    <DreiImage
      ref={meshRef}
      url={item.src}
      scale={[width, height]}
      side={THREE.DoubleSide}
      toneMapped={false}
      transparent
    />
  );
}

