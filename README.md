# Next.js + React Three Fiber Boilerplate

A modern boilerplate for building 3D web applications using Next.js 16, React 19, and React Three Fiber 9.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React version
- **React Three Fiber 9** - React renderer for Three.js (compatible with React 19)
- **Three.js** - 3D graphics library
- **@react-three/drei** - Useful helpers for React Three Fiber
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The main 3D scene is located in `src/components/Scene.tsx`. You can customize the scene by modifying this file.

## Project Structure

```
src/
├── app/
│   └── page.tsx          # Main page component
└── components/
    └── Scene.tsx         # 3D scene with Three.js objects
```

## Features

- Interactive 3D scene with orbit controls
- Basic geometric shapes (box, sphere, torus)
- Lighting setup with ambient and directional lights
- Responsive canvas that fills the viewport
- Client-side rendering with 'use client' directive

## Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

### React Three Fiber Resources
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber) - R3F API and guides
- [Three.js Documentation](https://threejs.org/docs/) - Three.js reference
- [Drei Documentation](https://github.com/pmndrs/drei) - useful R3F helpers

## Important Notes

- React Three Fiber version must match your React version:
  - `@react-three/fiber@9` pairs with `react@19`
  - `@react-three/fiber@8` pairs with `react@18`

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
