import * as THREE from 'three';
import { fbm3D } from './noise-utils';
import { CYLINDER_HEIGHT } from '../constants';

/**
 * Creates a cylindrical particle formation with procedural displacement
 * @param particleCount - Number of particles to generate
 * @param cylinderRadius - Radius of the cylinder
 * @param palette - Color palette to use for particles
 */
export function createCylinderGeometry(
  particleCount: number,
  cylinderRadius: number,
  palette: readonly THREE.Color[]
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  const normals: number[] = [];
  const originalHues: number[] = [];

  const tempPos = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const tempColor = new THREE.Color();
  const baseHSL = { h: 0, s: 0, l: 0 };
  const displacementStrength = 3.0;

  for (let i = 0; i < particleCount; i++) {
    // Distribute particles around cylinder
    const phi = Math.random() * Math.PI * 2;
    const h = (Math.random() - 0.5) * CYLINDER_HEIGHT;
    const x = cylinderRadius * Math.cos(phi);
    const z = cylinderRadius * Math.sin(phi);
    const y = h;

    tempPos.set(x, y, z);
    normal.set(x, 0, z).normalize();

    // Add procedural displacement
    const noiseInput = tempPos.clone().multiplyScalar(1.0 / cylinderRadius * 1.2);
    const displacement = fbm3D(noiseInput) * displacementStrength;
    tempPos.addScaledVector(normal, displacement);

    positions.push(tempPos.x, tempPos.y, tempPos.z);
    normals.push(normal.x, normal.y, normal.z);

    // Assign colors based on angular position
    const hueProgress = (phi / (Math.PI * 2)) % 1.0;
    const c1Index = Math.floor(hueProgress * (palette.length - 1));
    const c2Index = Math.min(c1Index + 1, palette.length - 1);

    tempColor.lerpColors(palette[c1Index], palette[c2Index], (hueProgress * (palette.length - 1)) % 1);
    tempColor.getHSL(baseHSL);
    originalHues.push(baseHSL.h);

    // Add slight color variation
    tempColor.offsetHSL(
      Math.random() * 0.02 - 0.01,
      Math.random() * 0.05 - 0.02,
      Math.random() * 0.05 - 0.02
    );

    colors.push(tempColor.r, tempColor.g, tempColor.b);

    // Size variation based on displacement
    const sizeFactor = 1.0 - Math.abs(displacement) / (displacementStrength + 1e-6);
    sizes.push(Math.max(0.3, sizeFactor) * (Math.random() * 0.4 + 0.7));
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('originalHue', new THREE.Float32BufferAttribute(originalHues, 1));

  return geometry;
}
