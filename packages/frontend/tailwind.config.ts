import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        bg: 'hsl(var(--bg) / <alpha-value>)',
        s0: 'hsl(var(--surface-0) / <alpha-value>)',
        s1: 'hsl(var(--surface-1) / <alpha-value>)',
        s2: 'hsl(var(--surface-2) / <alpha-value>)',
        // Borders
        border: {
          DEFAULT: 'hsl(var(--border) / <alpha-value>)',
          active: 'hsl(var(--border-active) / <alpha-value>)',
        },
        // Text
        t1: 'hsl(var(--text-100) / <alpha-value>)',
        t2: 'hsl(var(--text-200) / <alpha-value>)',
        t3: 'hsl(var(--text-300) / <alpha-value>)',
        t4: 'hsl(var(--text-400) / <alpha-value>)',
        // Accents
        orange: {
          DEFAULT: 'hsl(var(--orange) / <alpha-value>)',
          dim: 'hsl(var(--orange-dim) / <alpha-value>)',
        },
        yes: 'hsl(var(--green) / <alpha-value>)',
        no: 'hsl(var(--red) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['Chivo Mono', 'ui-monospace', 'monospace'],
        sans: ['Syne', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      animation: {
        'fade-up':     'fadeUp 0.4s ease-out both',
        'fade-in':     'fadeIn 0.3s ease-out both',
        'slide-right': 'slideRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'ticker':      'ticker 40s linear infinite',
        'price-flash': 'priceFlash 0.6s ease-out',
        'bar-fill':    'barFill 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-orange':'pulseOrange 2s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        priceFlash: {
          '0%':   { color: 'hsl(var(--orange))', },
          '60%':  { color: 'hsl(var(--orange))', },
          '100%': { color: 'hsl(var(--text-100))', },
        },
        barFill: {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--bar-width)' },
        },
        pulseOrange: {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1' },
        },
      },
      boxShadow: {
        'orange-sm': '0 0 0 1px hsl(var(--orange) / 0.3), 0 0 12px hsl(var(--orange) / 0.1)',
        'orange-md': '0 0 0 1px hsl(var(--orange) / 0.4), 0 0 24px hsl(var(--orange) / 0.15)',
        'yes-sm':    '0 0 0 1px hsl(var(--green) / 0.3), 0 0 12px hsl(var(--green) / 0.1)',
        'no-sm':     '0 0 0 1px hsl(var(--red) / 0.3), 0 0 12px hsl(var(--red) / 0.1)',
        'surface':   '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)',
        'modal':     '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px hsl(var(--border))',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
