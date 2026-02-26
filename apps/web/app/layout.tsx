import type { Metadata } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AppFrame } from '../components/AppFrame';

const baloo = Baloo_2({
  subsets: ['latin'],
  variable: '--font-display'
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: 'Sapling Language MVP',
  description: 'Desktop-first, local-first French learning app inspired by child language acquisition.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${baloo.variable} ${nunito.variable}`}>
        <Providers>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
