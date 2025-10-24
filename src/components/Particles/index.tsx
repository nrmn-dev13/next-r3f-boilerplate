'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MainFormation } from './components/MainFormation';
import { EnergySphere } from './components/EnergySphere';
import { ThemeSelector } from './ui/ThemeSelector';
import { Instructions } from './ui/Instructions';

/**
 * Interactive particle system with shockwave effects and theme switching
 *
 * Features:
 * - 75,000 particle cylindrical formation
 * - 10,000 particle energy sphere at center
 * - Mouse interaction with particle repulsion
 * - Click for expanding shockwave effect
 * - 3 color themes
 * - Bloom post-processing
 */
export default function Particles() {
  const [paletteIndex, setPaletteIndex] = useState(1);

  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 35, 0], fov: 75, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={Math.min(window.devicePixelRatio, 1.5)}
      >
        <color attach="background" args={[0x000000]} />

        <MainFormation paletteIndex={paletteIndex} />
        <EnergySphere paletteIndex={paletteIndex} />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          minDistance={5}
          maxDistance={100}
          target={[0, 0, 0]}
        />

        <EffectComposer>
          <Bloom strength={0.09} radius={0.45} luminanceThreshold={0.85} />
        </EffectComposer>
      </Canvas>

      <ThemeSelector activeTheme={paletteIndex} onThemeChange={setPaletteIndex} />
      <Instructions />
    </div>
  );
}
