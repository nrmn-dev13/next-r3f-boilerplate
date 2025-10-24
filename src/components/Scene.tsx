'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Box() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  )
}

function Sphere() {
  return (
    <mesh position={[3, 0, 0]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="cyan" />
    </mesh>
  )
}

function Torus() {
  return (
    <mesh position={[-3, 0, 0]}>
      <torusGeometry args={[1, 0.4, 16, 100]} />
      <meshStandardMaterial color="yellow" />
    </mesh>
  )
}

export default function Scene() {
  return (
    <div className="w-full h-screen">
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
