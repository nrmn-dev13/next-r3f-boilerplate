import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createEnergySphereGeometry, HSLData } from '../geometry/sphere-geometry';
import { vertexShader, fragmentShader } from '../shaders/particle.shader';
import { PARTICLE_COUNT_SPHERE, ENERGY_SPHERE_RADIUS, FORMATION_RADIUS } from '../constants';

interface EnergySphereProps {
  paletteIndex: number;
}

/**
 * Central energy sphere with animated color rotation
 */
export function EnergySphere({ paletteIndex }: EnergySphereProps) {
  const meshRef = useRef<THREE.Points>(null);

  // Create geometry only when palette changes
  const geometry = useMemo(
    () => createEnergySphereGeometry(PARTICLE_COUNT_SPHERE, ENERGY_SPHERE_RADIUS, paletteIndex),
    [paletteIndex]
  );

  // Initialize shader uniforms
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      uFormationRadius: { value: FORMATION_RADIUS },
    }),
    []
  );

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current || !meshRef.current.geometry) return;

    const elapsedTime = state.clock.getElapsedTime();
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.time.value = elapsedTime;

    // Update colors with hue rotation for rainbow effect
    const sphereGeometry = meshRef.current.geometry;
    const sphereColors = sphereGeometry.attributes.color;
    const sphereHslData = (
      sphereGeometry as THREE.BufferGeometry & { userData: { hslData: HSLData[] } }
    ).userData.hslData;

    if (sphereColors && sphereHslData) {
      const particleCount = sphereColors.count;
      const tempColor = new THREE.Color();

      for (let i = 0; i < particleCount; i++) {
        const hsl = sphereHslData[i];
        if (hsl) {
          const currentHue = (hsl.h + elapsedTime * 0.15) % 1.0;
          tempColor.setHSL(currentHue, hsl.s, hsl.l);
          sphereColors.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
        }
      }

      sphereColors.needsUpdate = true;
    }

    // Rotation and pulsing scale
    meshRef.current.rotation.y -= 0.002;
    const sphereScale = 1.0 + Math.sin(elapsedTime * 2.5) * 0.1;
    meshRef.current.scale.set(sphereScale, sphereScale, sphereScale);
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}
