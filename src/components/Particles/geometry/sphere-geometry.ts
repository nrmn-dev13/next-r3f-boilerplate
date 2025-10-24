import * as THREE from 'three';
import { COLOR_PALETTES } from '../constants';

export interface HSLData {
  h: number;
  s: number;
  l: number;
}

/**
 * Creates a spherical particle formation using Fibonacci distribution
 * @param particleCount - Number of particles to generate
 * @param radius - Radius of the sphere
 * @param paletteIndex - Index of color palette to use
 */
export function createEnergySphereGeometry(
  particleCount: number,
  radius: number,
  paletteIndex: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  const normals: number[] = [];
  const hslData: HSLData[] = [];

  // Golden ratio for Fibonacci sphere distribution
  const phiGolden = (1 + Math.sqrt(5)) / 2;
  const coreBaseColor = COLOR_PALETTES[paletteIndex][1];
  const baseHsl = { h: 0, s: 0, l: 0 };
  coreBaseColor.getHSL(baseHsl);

  for (let i = 0; i < particleCount; i++) {
    // Fibonacci sphere distribution
    const y = 1 - (i / (particleCount - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = (2 * Math.PI * i) / phiGolden;

    const x = Math.cos(theta) * radiusAtY * radius;
    const z = Math.sin(theta) * radiusAtY * radius;
    const finalY = y * radius;

    positions.push(x, finalY, z);

    const normal = new THREE.Vector3(x, finalY, z).normalize();
    normals.push(normal.x, normal.y, normal.z);

    // Color with HSL variation
    const initialHue = (baseHsl.h + Math.random() * 0.1 - 0.05) % 1.0;
    const initialSat = Math.max(0.7, baseHsl.s + Math.random() * 0.2 - 0.05);
    const initialLight = Math.min(0.9, baseHsl.l + Math.random() * 0.15);

    hslData.push({ h: initialHue, s: initialSat, l: initialLight });

    const color = new THREE.Color().setHSL(initialHue, initialSat, initialLight);
    colors.push(color.r, color.g, color.b);

    sizes.push(Math.random() * 0.5 + 0.5);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

  // Store HSL data for runtime color animation
  (geometry as THREE.BufferGeometry & { userData: { hslData: HSLData[] } }).userData.hslData = hslData;

  return geometry;
}
