'use client'

import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import gsap from 'gsap'
import type { Mesh } from 'three'

function Box() {
  const meshRef = useRef<Mesh>(null)

  useEffect(() => {
    if (meshRef.current) {
      // Animate scale on mount
      gsap.from(meshRef.current.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.5,
        ease: 'elastic.out(1, 0.5)',
      })

      // Continuous floating animation
      gsap.to(meshRef.current.position, {
        y: 0.5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      })
    }
  }, [])

  // Continuous rotation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}

function Sphere() {
  const meshRef = useRef<Mesh>(null)

  useEffect(() => {
    if (meshRef.current) {
      // Animate from the side
      gsap.from(meshRef.current.position, {
        x: 10,
        duration: 1.5,
        ease: 'back.out(1.7)',
      })

      // Pulsing scale animation
      gsap.to(meshRef.current.scale, {
        x: 1.3,
        y: 1.3,
        z: 1.3,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }
  }, [])

  // Continuous rotation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.015
    }
  })

  return (
    <mesh ref={meshRef} position={[3, 0, 0]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="cyan" />
    </mesh>
  )
}

function Torus() {
  const meshRef = useRef<Mesh>(null)

  useEffect(() => {
    if (meshRef.current) {
      // Animate from the side
      gsap.from(meshRef.current.position, {
        x: -10,
        duration: 1.5,
        ease: 'back.out(1.7)',
      })

      // Continuous rotation animation
      gsap.to(meshRef.current.rotation, {
        z: Math.PI * 2,
        duration: 4,
        repeat: -1,
        ease: 'none',
      })
    }
  }, [])

  // Additional rotation on another axis
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005
    }
  })

  return (
    <mesh ref={meshRef} position={[-3, 0, 0]}>
      <torusGeometry args={[1, 0.4, 16, 100]} />
      <meshStandardMaterial color="yellow" />
    </mesh>
  )
}

export default function Scene() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        {/* 3D Objects */}
        <Box />
        <Sphere />
        <Torus />

        {/* Controls */}
        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  )
}
