'use client';

import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function PillButton({ className, variant = 'primary', ...props }: Props) {
  return (
    <button
      className={clsx(
        'rounded-full px-5 py-3 font-display text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-sapling-500 text-white hover:bg-sapling-600',
        variant === 'secondary' && 'bg-earth-blue text-white hover:brightness-110',
        variant === 'ghost' && 'bg-white text-sapling-700 ring-2 ring-sapling-200 hover:bg-sapling-50',
        variant === 'danger' && 'bg-rose-500 text-white hover:bg-rose-600',
        className
      )}
      {...props}
    />
  );
}
