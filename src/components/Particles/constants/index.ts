import * as THREE from 'three';

// Particle system configuration
export const PARTICLE_COUNT_MAIN = 75000;
export const PARTICLE_COUNT_SPHERE = 10000;

// Formation parameters
export const CYLINDER_RADIUS = 15;
export const CYLINDER_HEIGHT = 30;
export const FORMATION_RADIUS = 25;
export const ENERGY_SPHERE_RADIUS = 6 * 0.6;

// Interaction parameters
export const SHOCKWAVE_SPEED = 40.0;
export const SHOCKWAVE_THICKNESS = 5.0;
export const MOUSE_REPEL_RADIUS = 8.0;
export const MOUSE_REPEL_STRENGTH = 1.5;

// Color palettes for theming
export const COLOR_PALETTES = [
  [
    new THREE.Color(0xff00ff), // Magenta
    new THREE.Color(0x00ffff), // Cyan
    new THREE.Color(0x00ff00), // Green
    new THREE.Color(0xffff00), // Yellow
    new THREE.Color(0x0077ff), // Blue
  ],
  [
    new THREE.Color(0xff2200), // Red
    new THREE.Color(0xff8800), // Orange
    new THREE.Color(0xffdd00), // Yellow
    new THREE.Color(0x880000), // Dark Red
    new THREE.Color(0x440000), // Darker Red
  ],
  [
    new THREE.Color(0x00ffaa), // Aqua
    new THREE.Color(0x00ddff), // Light Blue
    new THREE.Color(0xaaff00), // Lime
    new THREE.Color(0x0088cc), // Blue
    new THREE.Color(0x006644), // Teal
  ],
] as const;

// Theme gradients for UI buttons
export const THEME_GRADIENTS = [
  'linear-gradient(45deg, #ff00ff, #00ffff, #00ff00)',
  'linear-gradient(45deg, #ff2200, #ff8800, #ffdd00)',
  'linear-gradient(45deg, #00ffaa, #00ddff, #aaff00)',
] as const;
