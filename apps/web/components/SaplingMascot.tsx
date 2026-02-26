export function SaplingMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Sapling mascot">
      <defs>
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7DBB75" />
          <stop offset="100%" stopColor="#356735" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="92" r="22" fill="#7A5C45" opacity="0.2" />
      <rect x="53" y="52" width="14" height="44" rx="7" fill="#7A5C45" />
      <ellipse cx="40" cy="44" rx="22" ry="14" fill="url(#leafGradient)" transform="rotate(-18 40 44)" />
      <ellipse cx="80" cy="42" rx="22" ry="14" fill="url(#leafGradient)" transform="rotate(18 80 42)" />
      <circle cx="52" cy="70" r="3" fill="#19331c" />
      <circle cx="68" cy="70" r="3" fill="#19331c" />
      <path d="M50 80c2 4 6 6 10 6s8-2 10-6" stroke="#19331c" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
