import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createCylinderGeometry } from '../geometry/cylinder-geometry';
import { vertexShader, fragmentShader } from '../shaders/particle.shader';
import {
  PARTICLE_COUNT_MAIN,
  CYLINDER_RADIUS,
  COLOR_PALETTES,
  FORMATION_RADIUS,
  SHOCKWAVE_SPEED,
  SHOCKWAVE_THICKNESS,
  MOUSE_REPEL_RADIUS,
  MOUSE_REPEL_STRENGTH,
} from '../constants';

interface MainFormationProps {
  paletteIndex: number;
}

/**
 * Main cylindrical particle formation with interactive effects
 */
export function MainFormation({ paletteIndex }: MainFormationProps) {
  const meshRef = useRef<THREE.Points>(null);
  const { camera, size, raycaster, pointer, clock } = useThree();
  const mouseActiveRef = useRef(false);
  const interactionPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const interactionPointRef = useRef(new THREE.Vector3());

  // Create geometry only when palette changes
  const geometry = useMemo(
    () => createCylinderGeometry(PARTICLE_COUNT_MAIN, CYLINDER_RADIUS, COLOR_PALETTES[paletteIndex]),
    [paletteIndex]
  );

  // Initialize shader uniforms
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

  // Animation loop
  useFrame(() => {
    if (!meshRef.current) return;

    const elapsedTime = clock.getElapsedTime();
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.time.value = elapsedTime;

    // Handle mouse interaction
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

    // Gentle rotation
    meshRef.current.rotation.y += 0.0003;
    meshRef.current.rotation.x += 0.0005;
    meshRef.current.rotation.z -= 0.0002;
  });

  // Event handlers
  useEffect(() => {
    const handleMouseMove = () => {
      mouseActiveRef.current = true;
    };

    const handleMouseLeave = () => {
      mouseActiveRef.current = false;
    };

    const handleClick = (event: MouseEvent) => {
      // Ignore clicks on UI elements
      if (
        (event.target as HTMLElement).closest('.theme-selector') ||
        (event.target as HTMLElement).closest('.instructions')
      ) {
        return;
      }

      if (!meshRef.current) return;

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
