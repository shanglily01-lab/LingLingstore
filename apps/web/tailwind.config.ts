import type { Config } from 'tailwindcss'

/** Marketplace palette: gray page, teal links, yellow cart buttons. */
const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#eaeded',
        'on-surface': '#0f1111',
        'on-surface-variant': '#565959',
        'surface-container': '#f0f2f2',
        'surface-container-low': '#f7f8f8',
        'surface-container-high': '#d5d9d9',
        'outline-variant': '#d5d9d9',
        secondary: '#007185',
        'secondary-container': '#c7511f',
        'primary-container': '#232f3e',
        'on-primary-container': '#cccccc',
        error: '#b12704',
        'surface-container-lowest': '#ffffff',
        'surface-dim': '#e3e6e6',
        accent: '#ff9900',
        cart: '#ffd814',
      },
      maxWidth: {
        'container-max': '1500px',
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
