'use client';

import dynamic from 'next/dynamic';

const Particles = dynamic(() => import('@/components/Particles'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="relative w-full h-screen">
      <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-white z-10 pointer-events-none">
        NRMN.XYZ
      </h1>
      <Particles />
    </div>
  );
}
