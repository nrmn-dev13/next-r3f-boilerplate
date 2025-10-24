'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Scene', path: '/scene' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800">
      <nav className="container mx-auto px-4 py-4">
        <ul className="flex gap-6">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`text-sm font-medium transition-colors hover:text-white ${
                  pathname === item.path
                    ? 'text-white'
                    : 'text-zinc-400'
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
