import type { Config } from 'tailwindcss'

/** Design tokens from Google Stitch export (design-stitch/home.html) */
const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f8f9ff',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#45464d',
        'surface-container': '#e5eeff',
        'surface-container-low': '#eff4ff',
        'surface-container-high': '#dce9ff',
        'outline-variant': '#c6c6cd',
        secondary: '#4b41e1',
        'secondary-container': '#645efb',
        'primary-container': '#131b2e',
        'on-primary-container': '#7c839b',
        error: '#ba1a1a',
        'surface-container-lowest': '#ffffff',
        'surface-dim': '#cbdbf5',
      },
      maxWidth: {
        'container-max': '1280px',
      },
      spacing: {
        gutter: '24px',
        'margin-desktop': '40px',
        'margin-mobile': '16px',
        'section-gap': '80px',
      },
      boxShadow: {
        editorial: '0 10px 15px -3px rgba(15, 23, 42, 0.05)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg-mobile': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        'body-md': ['16px', { lineHeight: '1.5' }],
        'label-sm': ['14px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}

export default config
