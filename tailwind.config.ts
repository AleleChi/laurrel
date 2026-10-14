import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: {
            DEFAULT: '#390044',
            dark: '#27002E',
            light: '#4E025D',
            surface: '#F5EEF7',
          },
          lime: {
            DEFAULT: '#C8E80B',
            light: '#EAF794',
            dark: '#A6C200',
            text: '#557A00', // high-contrast accessible text variant
            tint: '#F5FAD9',
          },
          warm: {
            DEFAULT: '#F8F7F4',
            surface: '#FFFFFF',
            muted: '#F0EFEA',
          },
          ink: {
            DEFAULT: '#202024',
            muted: '#575757',
            light: '#8E8E93',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'button': '10px',
        'card': '16px',
        'media': '20px',
      },
      boxShadow: {
        'nav': '0 4px 20px -2px rgba(32, 32, 36, 0.05)',
        'nav-scrolled': '0 10px 30px -4px rgba(57, 0, 68, 0.08)',
        'card-soft': '0 12px 32px -4px rgba(32, 32, 36, 0.06)',
        'button-purple': '0 4px 14px 0 rgba(57, 0, 68, 0.25)',
      },
      animation: {
        'ticker': 'ticker 32s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
