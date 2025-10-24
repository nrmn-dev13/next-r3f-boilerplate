# Particles Component

An interactive 3D particle system built with React Three Fiber.

## Features

- **85,000 Total Particles**: 75k in main formation + 10k in energy sphere
- **Interactive Effects**: Mouse repulsion and click-triggered shockwaves
- **Theme System**: 3 color palettes with smooth transitions
- **Post-Processing**: Bloom effect for enhanced visuals
- **Performance Optimized**: Custom shaders, efficient geometry creation

## Project Structure

```
Particles/
├── index.tsx                      # Main component & Canvas setup
├── components/
│   ├── MainFormation.tsx          # Cylindrical particle formation
│   └── EnergySphere.tsx           # Central sphere with color animation
├── geometry/
│   ├── cylinder-geometry.ts       # Cylinder particle distribution
│   ├── sphere-geometry.ts         # Fibonacci sphere distribution
│   └── noise-utils.ts             # Procedural noise functions (CPU)
├── shaders/
│   ├── particle.shader.ts         # Vertex & Fragment shaders
│   └── noise.glsl.ts              # GLSL noise functions (GPU)
├── ui/
│   ├── ThemeSelector.tsx          # Color palette switcher
│   └── Instructions.tsx           # User instructions overlay
└── constants/
    └── index.ts                   # Configuration & constants
```

## Architecture

### Component Hierarchy

```
Particles (index.tsx)
├── Canvas (React Three Fiber)
│   ├── MainFormation
│   │   └── ShaderMaterial
│   ├── EnergySphere
│   │   └── ShaderMaterial
│   ├── OrbitControls
│   └── EffectComposer
│       └── Bloom
├── ThemeSelector (HTML Overlay)
└── Instructions (HTML Overlay)
```

### Data Flow

1. **Theme Selection**: User clicks theme button → `paletteIndex` state updates → geometries recreate with new colors
2. **Mouse Interaction**: Mouse move → Updates ref → `useFrame` reads ref → Updates shader uniforms
3. **Shockwave**: Click → Calculates 3D position → Updates shader uniforms → GPU renders wave expansion

## Key Concepts

### Geometry Creation

- **Cylinder**: Random distribution on cylinder surface + procedural displacement using FBM noise
- **Sphere**: Fibonacci sphere algorithm for even distribution

### Shader Animation

- **Vertex Shader**: Handles particle positioning, noise displacement, shockwave, and mouse repulsion
- **Fragment Shader**: Particle rendering, color mixing, glow effects

### Performance

- Geometry created once per theme change (memoized)
- Animation runs entirely on GPU via shaders
- Uniforms updated per frame (minimal CPU work)
- Pixel ratio capped at 1.5 for performance

## Usage

```tsx
import Particles from '@/components/Particles';

export default function Page() {
  return <Particles />;
}
```

## Customization

### Adjust Particle Count

Edit `constants/index.ts`:

```ts
export const PARTICLE_COUNT_MAIN = 75000;  // Main formation
export const PARTICLE_COUNT_SPHERE = 10000; // Energy sphere
```

### Add New Theme

Edit `constants/index.ts`:

```ts
export const COLOR_PALETTES = [
  // ... existing palettes
  [
    new THREE.Color(0xff0000), // Your colors
    new THREE.Color(0x00ff00),
    // ... 3-5 colors recommended
  ],
];

export const THEME_GRADIENTS = [
  // ... existing gradients
  'linear-gradient(45deg, #ff0000, #00ff00)',
];
```

### Modify Interaction Strength

Edit `constants/index.ts`:

```ts
export const MOUSE_REPEL_RADIUS = 8.0;     // Repulsion distance
export const MOUSE_REPEL_STRENGTH = 1.5;   // Repulsion force
export const SHOCKWAVE_SPEED = 40.0;       // Wave expansion speed
export const SHOCKWAVE_THICKNESS = 5.0;    // Wave width
```

## Dependencies

- `three` - 3D graphics library
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Helpers (OrbitControls)
- `@react-three/postprocessing` - Effects (Bloom)

## Best Practices Applied

✅ **Component Separation**: Each feature in its own file
✅ **Memoization**: Expensive operations cached
✅ **Refs for Animation**: Avoid re-renders during interaction
✅ **TypeScript**: Full type safety
✅ **Constants Extraction**: Easy configuration
✅ **Clear Naming**: Self-documenting code
✅ **Comments**: JSDoc for complex functions
✅ **Accessibility**: ARIA labels on theme buttons
