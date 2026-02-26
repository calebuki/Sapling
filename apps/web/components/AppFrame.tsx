'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import clsx from 'clsx';
import { SaplingMascot } from './SaplingMascot';
import { useAppStore } from '../lib/store';

const navItems = [
  { href: '/', label: 'Course Map' },
  { href: '/onboarding', label: 'Onboarding' },
  { href: '/progress', label: 'Progress' },
  { href: '/content', label: 'Content Viewer' }
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const devToolsVisible = useAppStore((state) => state.devToolsVisible);
  const toggleDevToolsVisible = useAppStore((state) => state.toggleDevToolsVisible);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.code === 'KeyD') {
        toggleDevToolsVisible();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleDevToolsVisible]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5faf4_0%,#fdf7ea_60%)]">
      <header className="border-b border-sapling-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <SaplingMascot className="h-12 w-12" />
            <div>
              <p className="font-display text-2xl font-bold text-sapling-700">Sapling</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">
                Meaning-first French
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 rounded-full bg-earth-cream p-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  pathname === item.href
                    ? 'bg-sapling-500 text-white shadow'
                    : 'text-sapling-700 hover:bg-sapling-100'
                )}
              >
                {item.label}
              </Link>
            ))}
            {devToolsVisible && (
              <Link
                href="/dev"
                className={clsx(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  pathname === '/dev'
                    ? 'bg-earth-blue text-white shadow'
                    : 'text-earth-blue hover:bg-blue-50'
                )}
              >
                Developer Tools
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-8 py-8">{children}</main>
    </div>
  );
}
