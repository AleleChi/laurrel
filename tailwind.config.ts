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
            DEFAULT: '#49056B',
            dark: '#34034D',
            light: '#5B0785',
            surface: '#F7F0FA',
          },
          orange: {
            DEFAULT: '#FE6000',
            hover: '#E05500',
            light: '#FF731A',
            surface: '#FFF3EB',
            text: '#18181B', // High-contrast accessible text for orange surfaces
          },
          accent: {
            DEFAULT: '#FE6000',
            hover: '#E05500',
            light: '#FF731A',
            surface: '#FFF3EB',
            text: '#18181B',
          },
          // Backward compatibility token mapping during transition
          lime: {
            DEFAULT: '#FE6000',
            light: '#FF731A',
            dark: '#E05500',
            text: '#18181B',
            tint: '#FFF3EB',
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
        'nav-scrolled': '0 10px 30px -4px rgba(73, 5, 107, 0.08)',
        'card-soft': '0 12px 32px -4px rgba(32, 32, 36, 0.06)',
        'button-purple': '0 4px 14px 0 rgba(73, 5, 107, 0.25)',
        'button-orange': '0 4px 14px 0 rgba(254, 96, 0, 0.25)',
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
