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
  return <Particles />;
}
