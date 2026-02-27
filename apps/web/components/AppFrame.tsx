'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { SaplingMascot } from './SaplingMascot';
import { LEARNING_LANGUAGES, getLearningLanguageMeta } from '../lib/languages';
import { useAppStore } from '../lib/store';

const navItems = [
  { href: '/', label: 'Course Map' },
  { href: '/progress', label: 'Progress' },
  { href: '/onboarding', label: 'Settings' }
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const devToolsVisible = useAppStore((state) => state.devToolsVisible);
  const toggleDevToolsVisible = useAppStore((state) => state.toggleDevToolsVisible);
  const activeLearningLanguage = useAppStore((state) => state.activeLearningLanguage);
  const setActiveLearningLanguage = useAppStore((state) => state.setActiveLearningLanguage);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [languageNotice, setLanguageNotice] = useState('');
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  const activeLanguageMeta = useMemo(
    () => getLearningLanguageMeta(activeLearningLanguage),
    [activeLearningLanguage]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.code === 'KeyD') {
        toggleDevToolsVisible();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleDevToolsVisible]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!languageMenuRef.current) {
        return;
      }

      if (!languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!languageNotice) {
      return;
    }

    const timeout = window.setTimeout(() => setLanguageNotice(''), 2500);
    return () => window.clearTimeout(timeout);
  }, [languageNotice]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f5faf4_0%,#fdf7ea_60%)]">
      <header className="sticky top-0 z-50 border-b border-sapling-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <SaplingMascot className="h-12 w-12" />
            <div>
              <p className="font-display text-2xl font-bold text-sapling-700">Sapling</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">
                Meaning-first {activeLanguageMeta.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            <div ref={languageMenuRef} className="relative">
              <button
                onClick={() => setIsLanguageMenuOpen((open) => !open)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-bubble ring-2 ring-sapling-100 transition hover:scale-[1.02]"
                aria-label={`Learning language: ${activeLanguageMeta.label}`}
              >
                {activeLanguageMeta.flag}
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 top-14 z-50 w-52 rounded-2xl border border-sapling-100 bg-white p-2 shadow-bubble">
                  {LEARNING_LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => {
                        setActiveLearningLanguage(language.code);
                        setIsLanguageMenuOpen(false);
                      }}
                      className={clsx(
                        'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition',
                        language.code === activeLearningLanguage
                          ? 'bg-sapling-100 text-sapling-800'
                          : 'text-sapling-700 hover:bg-sapling-50'
                      )}
                    >
                      <span>
                        {language.flag} {language.label}
                      </span>
                      {language.code === activeLearningLanguage && <span>✓</span>}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setLanguageNotice('More languages will be addable soon.');
                      setIsLanguageMenuOpen(false);
                    }}
                    className="mt-1 flex w-full items-center justify-center rounded-xl bg-earth-cream px-3 py-2 text-sm font-bold text-earth-brown transition hover:brightness-95"
                  >
                    + Add Language
                  </button>
                </div>
              )}

              {languageNotice && (
                <div className="absolute right-0 top-14 z-40 mt-16 w-52 rounded-xl bg-earth-cream px-3 py-2 text-xs font-semibold text-earth-brown shadow">
                  {languageNotice}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-8 py-8">{children}</main>
    </div>
  );
}
