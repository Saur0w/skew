"use client";

import React, { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { GalleryItem, TOTAL_ITEMS_COUNT } from "@/lib/data";

function wrap(val: number, min: number, max: number): number {
  const range = max - min;
  return ((((val - min) % range) + range) % range) + min;
}

const vertexShader = `
  uniform float uVelocity;
  uniform float uHover;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Diagonal velocity skew
    // Skew along both axes proportional to motion along diagonal
    float skewX = -uVelocity * 0.045;
    float skewY = -uVelocity * 0.03;
    
    pos.x += pos.y * skewX;
    pos.y += pos.x * skewY;

    // Fluid cylindrical bend along Z during fast drag/scroll
    float curve = sin(uv.x * 3.14159) * sin(uv.y * 3.14159);
    pos.z += curve * clamp(abs(uVelocity) * 0.25, 0.0, 0.6);

    // Hover elevation towards camera
    pos.z += uHover * 0.35;

    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uVelocity;
  uniform float uHover;
  uniform vec2 uPlaneAspect;
  uniform vec2 uImageAspect;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vPosition;

  vec2 getCoverUv(vec2 uv, vec2 planeRes, vec2 imgRes) {
    vec2 s = planeRes;
    vec2 i = imgRes;
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 newRes = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((newRes.x - s.x) * 0.5, 0.0) : vec2(0.0, (newRes.y - s.y) * 0.5)) / newRes;
    vec2 ratio = s / newRes;
    return uv * ratio + offset;
  }

  void main() {
    vec2 baseUv = getCoverUv(vUv, uPlaneAspect, uImageAspect);

    // Subtle zoom on hover
    vec2 center = vec2(0.5);
    vec2 uvHover = (baseUv - center) * (1.0 - uHover * 0.04) + center;

    // Velocity chromatic aberration aligned with diagonal movement
    vec2 dir = normalize(vec2(1.0, -0.75));
    float shift = clamp(uVelocity * 0.012, -0.035, 0.035);

    float r = texture2D(uTexture, uvHover + dir * shift).r;
    float g = texture2D(uTexture, uvHover).g;
    float b = texture2D(uTexture, uvHover - dir * shift).b;

    vec3 color = vec3(r, g, b);

    // Subtle exposure and contrast boost on hover
    color = mix(color, color * 1.08 + 0.02, uHover);

    // Crisp antialiased borders
    vec2 borderDist = min(vUv, 1.0 - vUv);
    float edge = min(borderDist.x, borderDist.y);
    float alpha = smoothstep(0.0, 0.002, edge);

    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`;

interface MeshCardProps {
  item: GalleryItem;
  index: number;
  texture: THREE.Texture;
  width: number;
  height: number;
  stepX: number;
  stepY: number;
  currentScrollRef: React.MutableRefObject<number>;
  velocityRef: React.MutableRefObject<number>;
  onSelect: (item: GalleryItem) => void;
  onHoverChange: (item: GalleryItem | null) => void;
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
  velocityRef,
  onSelect,
  onHoverChange,
}: MeshCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const hoverVal = useRef(0);

  // Setup custom uniforms
  const uniforms = useMemo(() => {
    const img = texture.image as { width?: number; height?: number } | undefined;
    const imgWidth = img?.width || 800;
    const imgHeight = img?.height || 1000;

    return {
      uTexture: { value: texture },
      uVelocity: { value: 0 },
      uHover: { value: 0 },
      uTime: { value: 0 },
      uPlaneAspect: { value: new THREE.Vector2(width, height) },
      uImageAspect: { value: new THREE.Vector2(imgWidth, imgHeight) },
      uOpacity: { value: 1.0 },
    };
  }, [texture, width, height]);

  // Update plane aspect when size changes
  React.useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uPlaneAspect.value.set(width, height);
      const img = texture.image as { width?: number; height?: number } | undefined;
      if (img?.width && img?.height) {
        materialRef.current.uniforms.uImageAspect.value.set(img.width, img.height);
      }
    }
  }, [width, height, texture]);

  const halfCount = TOTAL_ITEMS_COUNT / 2;

  useFrame((state, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    // Smooth hover interpolation
    const targetHover = hovered ? 1 : 0;
    hoverVal.current = THREE.MathUtils.damp(
      hoverVal.current,
      targetHover,
      10,
      delta
    );

    // Uniform updates
    materialRef.current.uniforms.uHover.value = hoverVal.current;
    materialRef.current.uniforms.uVelocity.value = velocityRef.current;
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Calculate wrapped diagonal coordinate
    const virtualPos = wrap(
      index - currentScrollRef.current,
      -halfCount,
      halfCount
    );

    // Position in 3D world units
    meshRef.current.position.x = virtualPos * stepX;
    meshRef.current.position.y = virtualPos * stepY;
    meshRef.current.position.z = hoverVal.current * 0.25;

    // 3D Tilt with velocity and mouse pointer
    const targetRotZ = -velocityRef.current * 0.018;
    const targetRotX = (state.pointer.y * 0.04) + hoverVal.current * 0.02;
    const targetRotY = (state.pointer.x * 0.04) - velocityRef.current * 0.012;

    meshRef.current.rotation.z = THREE.MathUtils.damp(
      meshRef.current.rotation.z,
      targetRotZ,
      6,
      delta
    );
    meshRef.current.rotation.x = THREE.MathUtils.damp(
      meshRef.current.rotation.x,
      targetRotX,
      6,
      delta
    );
    meshRef.current.rotation.y = THREE.MathUtils.damp(
      meshRef.current.rotation.y,
      targetRotY,
      6,
      delta
    );

    // Scale up slightly on hover
    const targetScale = 1.0 + hoverVal.current * 0.04;
    meshRef.current.scale.setScalar(targetScale);
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHoverChange(item);
      }}
      onPointerOut={() => {
        setHovered(false);
        onHoverChange(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
    >
      <planeGeometry args={[width, height, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
