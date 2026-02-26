import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sapling: {
          50: '#f5faf4',
          100: '#e7f3e3',
          200: '#c9e6c1',
          300: '#a4d39d',
          400: '#7dbb75',
          500: '#5ba558',
          600: '#468446',
          700: '#356735',
          800: '#264c28',
          900: '#19331c'
        },
        earth: {
          brown: '#7A5C45',
          blue: '#4B7FA0',
          yellow: '#F6C453',
          cream: '#FDF7EA'
        }
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      boxShadow: {
        bubble: '0 12px 24px rgba(25, 51, 28, 0.12)'
      },
      fontFamily: {
        display: ['\"Baloo 2\"', 'system-ui', 'sans-serif'],
        body: ['\"Nunito\"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};

export default config;
