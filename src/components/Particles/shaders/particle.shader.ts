import { noiseFunctionsGLSL } from './noise.glsl';

/**
 * Vertex Shader for particle system
 * Handles particle positioning, animation, and interaction effects
 */
export const vertexShader = `
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

    // Procedural noise animation
    float noiseScale = 0.4;
    float noiseStrength = 1.2;
    float displacement = fbm(position * noiseScale * 0.1, t * 0.3) * noiseStrength;
    vec3 animatedModulation = vNormal * displacement;

    // Shockwave effect on click
    vec3 shockwavePushForce = vec3(0.0);
    float shockwaveSizeIncrease = 0.0;

    if (uOuterClickTime > 0.0) {
      float timeSinceClick = t - uOuterClickTime;

      if (timeSinceClick >= 0.0 && timeSinceClick < 2.5) {
        float waveRadius = timeSinceClick * uWaveSpeed;
        vec4 worldPos4Base = modelMatrix * vec4(position, 1.0);
        vec3 worldPosBase = worldPos4Base.xyz / worldPos4Base.w;
        float distToClick = length(worldPosBase - uOuterClickPos);
        float waveProximity = abs(distToClick - waveRadius);

        vWaveFactor = smoothstep(uWaveThickness, 0.0, waveProximity);

        if (vWaveFactor > 0.0) {
          float shockwaveStrength = 7.0;
          vec3 pushDir = normalize(worldPosBase - uOuterClickPos);
          if (length(pushDir) < 0.001) {
            pushDir = vNormal;
          }
          shockwavePushForce = pushDir * vWaveFactor * shockwaveStrength;
          shockwaveSizeIncrease = vWaveFactor * 1.5;
        }
      }
    }

    // Mouse repulsion effect
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

    // Apply all position modifications
    pos += animatedModulation + shockwavePushForce + mouseRepelForce;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDistance = length(mvPosition.xyz);
    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

    // Dynamic particle size with pulsing animation
    float sizeModulation = size * (1.0 + sin(t * 2.5 + length(position) * 0.1) * 0.3);
    gl_PointSize = (sizeModulation + shockwaveSizeIncrease) * (1500.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Fragment Shader for particle system
 * Handles particle rendering, colors, and visual effects
 */
export const fragmentShader = `
  varying vec3 vColor;
  varying float vDistance;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveFactor;
  varying float vOriginalHue;

  uniform float time;
  uniform float uFormationRadius;

  vec3 gradientMix(vec3 c1, vec3 c2, vec3 c3, float t) {
    return mix(
      mix(c1, c2, smoothstep(0.0, 0.5, t)),
      mix(c2, c3, smoothstep(0.5, 1.0, t)),
      step(0.5, t)
    );
  }

  void main() {
    vec2 uv = gl_PointCoord;
    vec2 cxy = 2.0 * uv - 1.0;
    float r2 = dot(cxy, cxy);

    // Discard pixels outside circular shape
    if (r2 > 1.0) discard;

    float r = sqrt(r2);

    // Create soft glow effect
    float coreSharpness = 0.1;
    float glowFalloff = 0.6;
    float coreIntensity = smoothstep(coreSharpness, 0.0, r);
    float glowIntensity = smoothstep(glowFalloff, coreSharpness, r);
    float alpha = coreIntensity + glowIntensity * (1.0 - coreIntensity);

    vec3 baseColor = vColor;

    // Shockwave fiery effect
    if (vWaveFactor > 0.0) {
      vec3 fieryColor1 = vec3(1.0, 1.0, 0.9);  // White
      vec3 fieryColor2 = vec3(1.0, 0.7, 0.0);  // Orange
      vec3 fieryColor3 = vec3(0.9, 0.2, 0.0);  // Red

      float gradientT = vWaveFactor;
      vec3 fieryColor = gradientMix(fieryColor3, fieryColor2, fieryColor1, gradientT);

      baseColor = mix(baseColor, fieryColor, vWaveFactor * 0.85);
      baseColor *= (1.0 + vWaveFactor * 1.5);
    }

    // Distance-based fade
    float distanceFade = smoothstep(uFormationRadius * 1.8, uFormationRadius * 0.9, vDistance);
    alpha *= distanceFade;

    // Clamp brightness
    baseColor = clamp(baseColor, 0.0, 3.5);

    gl_FragColor = vec4(baseColor, alpha);
  }
`;
