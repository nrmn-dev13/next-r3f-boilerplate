'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Constants
const PARTICLE_COUNT_MAIN = 75000;
const PARTICLE_COUNT_SPHERE = 10000;
const CYLINDER_RADIUS = 15;
const CYLINDER_HEIGHT = 30;
const FORMATION_RADIUS = 25;
const ENERGY_SPHERE_RADIUS = 6 * 0.6;
const SHOCKWAVE_SPEED = 40.0;
const SHOCKWAVE_THICKNESS = 5.0;
const MOUSE_REPEL_RADIUS = 8.0;
const MOUSE_REPEL_STRENGTH = 1.5;

// Color palettes
const colorPalettes = [
  [
    new THREE.Color(0xff00ff),
    new THREE.Color(0x00ffff),
    new THREE.Color(0x00ff00),
    new THREE.Color(0xffff00),
    new THREE.Color(0x0077ff),
  ],
  [
    new THREE.Color(0xff2200),
    new THREE.Color(0xff8800),
    new THREE.Color(0xffdd00),
    new THREE.Color(0x880000),
    new THREE.Color(0x440000),
  ],
  [
    new THREE.Color(0x00ffaa),
    new THREE.Color(0x00ddff),
    new THREE.Color(0xaaff00),
    new THREE.Color(0x0088cc),
    new THREE.Color(0x006644),
  ],
];

// Noise functions GLSL
const noiseFunctionsGLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy ); vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m; return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }
  float fbm(vec3 p, float time) {
    float value = 0.0; float amplitude = 0.5; float frequency = 0.8; int octaves = 3;
    for (int i = 0; i < octaves; i++) {
      value += amplitude * snoise(p * frequency + time * 0.10 * frequency);
      amplitude *= 0.5; frequency *= 2.0;
    } return value;
  }
`;

// Vertex Shader
const vertexShader = `
  attribute float size;
  attribute float originalHue;
  varying vec3 vColor;
  varying float vDistance;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveFactor;
  varying float vOriginalHue;

  uniform float time;
  uniform vec3 uOuterClickPos;
  uniform float uOuterClickTime;
  uniform float uWaveSpeed;
  uniform float uWaveThickness;
  uniform vec3 uMousePos;
  uniform float uMouseActive;
  uniform float uMouseRepelRadius;
  uniform float uMouseRepelStrength;

  ${noiseFunctionsGLSL}

  void main() {
    vColor = color;
    vNormal = normal;
    vWaveFactor = 0.0;
    vOriginalHue = originalHue;

    vec3 pos = position;
    float t = time;

    float noiseScale = 0.4;
    float noiseStrength = 1.2;
    float displacement = fbm(position * noiseScale * 0.1, t * 0.3) * noiseStrength;
    vec3 animatedModulation = vNormal * displacement;

    vec3 shockwavePushForce = vec3(0.0);
    float shockwaveSizeIncrease = 0.0;
    if (uOuterClickTime > 0.0) {
      float timeSinceClick = t - uOuterClickTime;
      if(timeSinceClick >= 0.0 && timeSinceClick < 2.5) {
        float waveRadius = timeSinceClick * uWaveSpeed;
        vec4 worldPos4Base = modelMatrix * vec4(position, 1.0);
        vec3 worldPosBase = worldPos4Base.xyz / worldPos4Base.w;
        float distToClick = length(worldPosBase - uOuterClickPos);
        float waveProximity = abs(distToClick - waveRadius);
        vWaveFactor = smoothstep(uWaveThickness, 0.0, waveProximity);
        if (vWaveFactor > 0.0) {
          float shockwaveStrength = 7.0;
          vec3 pushDir = normalize(worldPosBase - uOuterClickPos);
          if (length(pushDir) < 0.001) { pushDir = vNormal; }
          shockwavePushForce = pushDir * vWaveFactor * shockwaveStrength;
          shockwaveSizeIncrease = vWaveFactor * 1.5;
        }
      }
    }

    vec3 mouseRepelForce = vec3(0.0);
    if (uMouseActive > 0.5) {
      vec4 worldPos4Current = modelMatrix * vec4(position + animatedModulation, 1.0);
      vec3 worldPosCurrent = worldPos4Current.xyz / worldPos4Current.w;
      vec3 diff = worldPosCurrent - uMousePos;
      float distToMouse = length(diff);
      if (distToMouse < uMouseRepelRadius) {
        float repelFactor = smoothstep(uMouseRepelRadius, 0.0, distToMouse);
        mouseRepelForce = normalize(diff) * repelFactor * uMouseRepelStrength;
      }
    }

    pos += animatedModulation + shockwavePushForce + mouseRepelForce;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDistance = length(mvPosition.xyz);
    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    float sizeModulation = size * (1.0 + sin(t * 2.5 + length(position) * 0.1) * 0.3);
    gl_PointSize = (sizeModulation + shockwaveSizeIncrease) * (1500.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment Shader
const fragmentShader = `
  varying vec3 vColor;
  varying float vDistance;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveFactor;
  varying float vOriginalHue;
  uniform float time;
  uniform float uFormationRadius;

  vec3 gradientMix(vec3 c1, vec3 c2, vec3 c3, float t) {
    return mix(mix(c1, c2, smoothstep(0.0, 0.5, t)), mix(c2, c3, smoothstep(0.5, 1.0, t)), step(0.5, t));
  }

  void main() {
    vec2 uv = gl_PointCoord;
    vec2 cxy = 2.0 * uv - 1.0;
    float r2 = dot(cxy, cxy);
    if (r2 > 1.0) discard;
    float r = sqrt(r2);
    float coreSharpness = 0.1;
    float glowFalloff = 0.6;
    float coreIntensity = smoothstep(coreSharpness, 0.0, r);
    float glowIntensity = smoothstep(glowFalloff, coreSharpness, r);
    float alpha = coreIntensity + glowIntensity * (1.0 - coreIntensity);

    vec3 baseColor = vColor;

    if (vWaveFactor > 0.0) {
      vec3 fieryColor1 = vec3(1.0, 1.0, 0.9);
      vec3 fieryColor2 = vec3(1.0, 0.7, 0.0);
      vec3 fieryColor3 = vec3(0.9, 0.2, 0.0);
      float gradientT = vWaveFactor;
      vec3 fieryColor = gradientMix(fieryColor3, fieryColor2, fieryColor1, gradientT);
      baseColor = mix(baseColor, fieryColor, vWaveFactor * 0.85);
      baseColor *= (1.0 + vWaveFactor * 1.5);
    }

    float distanceFade = smoothstep(uFormationRadius * 1.8, uFormationRadius * 0.9, vDistance);
    alpha *= distanceFade;
    baseColor = clamp(baseColor, 0.0, 3.5);

    gl_FragColor = vec4(baseColor, alpha);
  }
`;

// JavaScript noise functions for geometry creation
const step3 = (edge: THREE.Vector3, x: THREE.Vector3) =>
  new THREE.Vector3(x.x < edge.x ? 0.0 : 1.0, x.y < edge.y ? 0.0 : 1.0, x.z < edge.z ? 0.0 : 1.0);

const step4 = (edge: THREE.Vector4, x: THREE.Vector4) =>
  new THREE.Vector4(
    x.x < edge.x ? 0.0 : 1.0,
    x.y < edge.y ? 0.0 : 1.0,
    x.z < edge.z ? 0.0 : 1.0,
    x.w < edge.w ? 0.0 : 1.0
  );

const abs4 = (v: THREE.Vector4) =>
  new THREE.Vector4(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z), Math.abs(v.w));

const _mod289_3 = (x: THREE.Vector3) =>
  x.sub(x.clone().multiplyScalar(1.0 / 289.0).floor().multiplyScalar(289.0));

const _mod289_4 = (x: THREE.Vector4) =>
  x.sub(x.clone().multiplyScalar(1.0 / 289.0).floor().multiplyScalar(289.0));

const _permute_4 = (x: THREE.Vector4) =>
  _mod289_4(x.clone().multiplyScalar(34.0).addScalar(1.0).multiply(x));

const _taylorInvSqrt_4 = (r: THREE.Vector4) =>
  r.clone().multiplyScalar(-0.85373472095314).addScalar(1.79284291400159);

const _snoise_3 = (v: THREE.Vector3): number => {
  const C = new THREE.Vector2(1.0 / 6.0, 1.0 / 3.0);
  const D = new THREE.Vector4(0.0, 0.5, 1.0, 2.0);
  const v_dot_Cyyy = v.dot(new THREE.Vector3(C.y, C.y, C.y));
  const i = v.clone().add(new THREE.Vector3(v_dot_Cyyy, v_dot_Cyyy, v_dot_Cyyy)).floor();
  const i_dot_Cxxx = i.dot(new THREE.Vector3(C.x, C.x, C.x));
  const x0 = v.clone().sub(i).add(new THREE.Vector3(i_dot_Cxxx, i_dot_Cxxx, i_dot_Cxxx));
  const g = step3(x0.clone().set(x0.y, x0.z, x0.x), x0);
  const l = new THREE.Vector3(1.0, 1.0, 1.0).sub(g);
  const i1 = g.clone().min(l.clone().set(l.z, l.x, l.y));
  const i2 = g.clone().max(l.clone().set(l.z, l.x, l.y));
  const x1 = x0.clone().sub(i1).addScalar(C.x);
  const x2 = x0.clone().sub(i2).addScalar(C.y);
  const x3 = x0.clone().subScalar(D.y);
  const i_mod = _mod289_3(i);
  const p = _permute_4(
    _permute_4(
      _permute_4(new THREE.Vector4(0.0, i1.z, i2.z, 1.0).addScalar(i_mod.z)).add(
        new THREE.Vector4(0.0, i1.y, i2.y, 1.0).addScalar(i_mod.y)
      )
    ).add(new THREE.Vector4(0.0, i1.x, i2.x, 1.0).addScalar(i_mod.x))
  );
  const n_ = 0.142857142857;
  const nsVec = new THREE.Vector3(D.w, D.y, D.z);
  const ns = nsVec.clone().multiplyScalar(n_).sub(new THREE.Vector3(D.x, D.z, D.x));
  const j = p.clone().sub(p.clone().multiplyScalar(ns.z * ns.z).floor().multiplyScalar(49.0));
  const x_ = j.clone().multiplyScalar(ns.z).floor();
  const y_ = j.clone().sub(x_.clone().multiplyScalar(7.0)).floor();
  const x = x_.clone().multiplyScalar(ns.x).addScalar(ns.y);
  const y = y_.clone().multiplyScalar(ns.x).addScalar(ns.y);
  const h = new THREE.Vector4(1.0, 1.0, 1.0, 1.0).sub(abs4(x)).sub(abs4(y));
  const b0 = new THREE.Vector4(x.x, x.y, y.x, y.y);
  const b1 = new THREE.Vector4(x.z, x.w, y.z, y.w);
  const s0 = b0.clone().floor().multiplyScalar(2.0).addScalar(1.0);
  const s1 = b1.clone().floor().multiplyScalar(2.0).addScalar(1.0);
  const sh = step4(new THREE.Vector4(0.0, 0.0, 0.0, 0.0), h).multiplyScalar(-1.0);
  const a0 = b0
    .clone()
    .set(b0.x, b0.z, b0.y, b0.w)
    .add(s0.clone().set(s0.x, s0.z, s0.y, s0.w).multiply(sh.clone().set(sh.x, sh.x, sh.y, sh.y)));
  const a1 = b1
    .clone()
    .set(b1.x, b1.z, b1.y, b1.w)
    .add(s1.clone().set(s1.x, s1.z, s1.y, s1.w).multiply(sh.clone().set(sh.z, sh.z, sh.w, sh.w)));
  const p0 = new THREE.Vector3(a0.x, a0.y, h.x);
  const p1 = new THREE.Vector3(a0.z, a0.w, h.y);
  const p2 = new THREE.Vector3(a1.x, a1.y, h.z);
  const p3 = new THREE.Vector3(a1.z, a1.w, h.w);
  const norm = _taylorInvSqrt_4(new THREE.Vector4(p0.dot(p0), p1.dot(p1), p2.dot(p2), p3.dot(p3)));
  p0.multiplyScalar(norm.x);
  p1.multiplyScalar(norm.y);
  p2.multiplyScalar(norm.z);
  p3.multiplyScalar(norm.w);
  const m = new THREE.Vector4(x0.dot(x0), x1.dot(x1), x2.dot(x2), x3.dot(x3))
    .multiplyScalar(-1.0)
    .addScalar(0.6)
    .max(new THREE.Vector4(0.0, 0.0, 0.0, 0.0));
  m.multiply(m);
  return 42.0 * m.dot(new THREE.Vector4(p0.dot(x0), p1.dot(x1), p2.dot(x2), p3.dot(x3)));
};

const _fbm_3 = (p: THREE.Vector3): number => {
  let value = 0.0;
  let amplitude = 0.5;
  let frequency = 0.8;
  const octaves = 3;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * _snoise_3(p.clone().multiplyScalar(frequency));
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
};

// Geometry creation functions
function createCylinderGeometry(particleCount: number, cylinderRadius: number, palette: THREE.Color[]) {
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
    const phi = Math.random() * Math.PI * 2;
    const h = (Math.random() - 0.5) * CYLINDER_HEIGHT;
    const x = cylinderRadius * Math.cos(phi);
    const z = cylinderRadius * Math.sin(phi);
    const y = h;
    tempPos.set(x, y, z);
    normal.set(x, 0, z).normalize();
    const noiseInput = tempPos.clone().multiplyScalar(1.0 / cylinderRadius * 1.2);
    const displacement = _fbm_3(noiseInput) * displacementStrength;
    tempPos.addScaledVector(normal, displacement);
    positions.push(tempPos.x, tempPos.y, tempPos.z);
    normals.push(normal.x, normal.y, normal.z);
    const hueProgress = (phi / (Math.PI * 2)) % 1.0;
    const c1Index = Math.floor(hueProgress * (palette.length - 1));
    const c2Index = Math.min(c1Index + 1, palette.length - 1);
    tempColor.lerpColors(palette[c1Index], palette[c2Index], (hueProgress * (palette.length - 1)) % 1);
    tempColor.getHSL(baseHSL);
    originalHues.push(baseHSL.h);
    tempColor.offsetHSL(
      Math.random() * 0.02 - 0.01,
      Math.random() * 0.05 - 0.02,
      Math.random() * 0.05 - 0.02
    );
    colors.push(tempColor.r, tempColor.g, tempColor.b);
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

function createEnergySphereGeometry(particleCount: number, radius: number, paletteIndex: number) {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  const normals: number[] = [];
  const hslData: { h: number; s: number; l: number }[] = [];
  const phiGolden = (1 + Math.sqrt(5)) / 2;
  const coreBaseColor = colorPalettes[paletteIndex][1];
  const baseHsl = { h: 0, s: 0, l: 0 };
  coreBaseColor.getHSL(baseHsl);

  for (let i = 0; i < particleCount; i++) {
    const y = 1 - (i / (particleCount - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = (2 * Math.PI * i) / phiGolden;
    const x = Math.cos(theta) * radiusAtY * radius;
    const z = Math.sin(theta) * radiusAtY * radius;
    const finalY = y * radius;
    positions.push(x, finalY, z);
    const normal = new THREE.Vector3(x, finalY, z).normalize();
    normals.push(normal.x, normal.y, normal.z);
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
  (geometry as THREE.BufferGeometry & { userData: { hslData: { h: number; s: number; l: number }[] } }).userData.hslData = hslData;
  return geometry;
}

// Main particle formation component
function MainFormation({ paletteIndex }: { paletteIndex: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const { camera, size, raycaster, pointer, clock } = useThree();
  const mouseActiveRef = useRef(false);
  const interactionPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const interactionPointRef = useRef(new THREE.Vector3());

  const geometry = useMemo(
    () => createCylinderGeometry(PARTICLE_COUNT_MAIN, CYLINDER_RADIUS, colorPalettes[paletteIndex]),
    [paletteIndex]
  );

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      uOuterClickPos: { value: new THREE.Vector3(0, 0, 0) },
      uOuterClickTime: { value: -1000.0 },
      uWaveSpeed: { value: SHOCKWAVE_SPEED },
      uWaveThickness: { value: SHOCKWAVE_THICKNESS },
      uMousePos: { value: new THREE.Vector3(0, 0, 0) },
      uMouseActive: { value: 0.0 },
      uMouseRepelRadius: { value: MOUSE_REPEL_RADIUS },
      uMouseRepelStrength: { value: MOUSE_REPEL_STRENGTH },
      uFormationRadius: { value: FORMATION_RADIUS },
    }),
    []
  );

  useFrame((state) => {
    if (meshRef.current) {
      const elapsedTime = state.clock.getElapsedTime();
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.time.value = elapsedTime;

      // Mouse interaction
      if (mouseActiveRef.current) {
        const interactionPlane = interactionPlaneRef.current;
        const interactionPoint = interactionPointRef.current;
        interactionPlane.normal.copy(camera.position).normalize();
        interactionPlane.constant = 0;
        raycaster.setFromCamera(pointer, camera);
        if (raycaster.ray.intersectPlane(interactionPlane, interactionPoint)) {
          material.uniforms.uMousePos.value.copy(interactionPoint);
        }
        material.uniforms.uMouseActive.value = 1.0;
      } else {
        material.uniforms.uMouseActive.value = 0.0;
      }

      // Rotation
      meshRef.current.rotation.y += 0.0003;
      meshRef.current.rotation.x += 0.0005;
      meshRef.current.rotation.z -= 0.0002;
    }
  });

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = () => {
      mouseActiveRef.current = true;
    };
    const handleMouseLeave = () => {
      mouseActiveRef.current = false;
    };

    const handleClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('.theme-selector') ||
          (event.target as HTMLElement).closest('.instructions')) return;

      if (meshRef.current) {
        const mouseVec = new THREE.Vector2(
          (event.clientX / size.width) * 2 - 1,
          -(event.clientY / size.height) * 2 + 1
        );
        const interactionPlane = interactionPlaneRef.current;
        const interactionPoint = interactionPointRef.current;
        raycaster.setFromCamera(mouseVec, camera);
        interactionPlane.normal.copy(camera.position).normalize();
        interactionPlane.constant = 0;

        if (raycaster.ray.intersectPlane(interactionPlane, interactionPoint)) {
          const currentTime = clock.getElapsedTime();
          const material = meshRef.current.material as THREE.ShaderMaterial;
          material.uniforms.uOuterClickPos.value.copy(interactionPoint);
          material.uniforms.uOuterClickTime.value = currentTime;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, [camera, raycaster, size, clock]);

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

// Energy sphere component
function EnergySphere({ paletteIndex }: { paletteIndex: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const geometry = useMemo(
    () => createEnergySphereGeometry(PARTICLE_COUNT_SPHERE, ENERGY_SPHERE_RADIUS, paletteIndex),
    [paletteIndex]
  );

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      uFormationRadius: { value: FORMATION_RADIUS },
    }),
    []
  );

  useFrame((state) => {
    if (meshRef.current && meshRef.current.geometry) {
      const elapsedTime = state.clock.getElapsedTime();
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.time.value = elapsedTime;

      // Update colors with hue rotation
      const sphereGeometry = meshRef.current.geometry;
      const sphereColors = sphereGeometry.attributes.color;
      const sphereHslData = (sphereGeometry as THREE.BufferGeometry & { userData: { hslData: { h: number; s: number; l: number }[] } }).userData.hslData;

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

      // Rotation and scale
      meshRef.current.rotation.y -= 0.002;
      const sphereScale = 1.0 + Math.sin(elapsedTime * 2.5) * 0.1;
      meshRef.current.scale.set(sphereScale, sphereScale, sphereScale);
    }
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

// Theme selector component
function ThemeSelector({
  activeTheme,
  onThemeChange,
}: {
  activeTheme: number;
  onThemeChange: (index: number) => void;
}) {
  const themes = [
    'linear-gradient(45deg, #ff00ff, #00ffff, #00ff00)',
    'linear-gradient(45deg, #ff2200, #ff8800, #ffdd00)',
    'linear-gradient(45deg, #00ffaa, #00ddff, #aaff00)',
  ];

  return (
    <div className="theme-selector absolute top-5 right-5 p-2 flex gap-3 bg-black/30 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
      {themes.map((theme, index) => (
        <button
          key={index}
          className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all duration-200 ease-in-out hover:scale-110 hover:border-white/70 focus:outline-none ${
            activeTheme === index
              ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]'
              : 'border-white/30'
          }`}
          style={{ background: theme }}
          onClick={() => onThemeChange(index)}
          aria-label={`Theme ${index + 1}`}
        />
      ))}
    </div>
  );
}

// Instructions component
function Instructions() {
  return (
    <div className="instructions absolute bottom-5 left-5 p-4 bg-black/30 backdrop-blur-md rounded-lg border border-white/20 shadow-lg text-center text-sm text-gray-200 max-w-[180px]">
      Move mouse to interact
      <br />
      Click or Tap for shockwave
    </div>
  );
}

// Main Particles component
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
