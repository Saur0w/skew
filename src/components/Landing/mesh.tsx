"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, ThreeEvent } from "@react-three/fiber";
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
  onSelectCard?: (index: number) => void;
}

export default function MeshCard({
  item,
  index,
  width,
  height,
  stepX,
  stepY,
  currentScrollRef,
  onSelectCard,
}: MeshCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const halfCount = TOTAL_ITEMS_COUNT / 2;

  useFrame((_, delta) => {
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

    // Subtle elevation when hovering a card
    const targetZ = hovered ? 0.22 : 0;
    meshRef.current.position.z = THREE.MathUtils.damp(
      meshRef.current.position.z,
      targetZ,
      8,
      delta
    );

    // Distance falloff from center: middle card is 100% visible,
    // immediate neighbors are softly translucent, and outer cards fade away into background
    const dist = Math.abs(virtualPos);
    const targetOpacity = Math.max(0, Math.min(1, 1 - Math.pow(dist / 1.75, 2.2)));
    if (meshRef.current.material) {
      (meshRef.current.material as THREE.ShaderMaterial).opacity = targetOpacity;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const virtualPos = wrap(
      index - currentScrollRef.current,
      -halfCount,
      halfCount
    );
    if (Math.abs(virtualPos) > 1.4) return;
    onSelectCard?.(index);
  };

  return (
    <DreiImage
      ref={meshRef}
      url={item.src}
      scale={[width, height]}
      side={THREE.DoubleSide}
      toneMapped={false}
      transparent
      zoom={hovered ? 1.04 : 1.0}
      onPointerOver={(e) => {
        const virtualPos = wrap(
          index - currentScrollRef.current,
          -halfCount,
          halfCount
        );
        if (Math.abs(virtualPos) > 1.4) return;
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => {
        setHovered(false);
      }}
      onClick={handleClick}
    />
  );
}


