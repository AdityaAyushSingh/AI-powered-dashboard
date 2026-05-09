/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        soft:      '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        card:      '0 0 0 1px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.06)',
        popup:     '0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
        modal:     '0 20px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
        glow:      '0 0 20px rgba(99,102,241,0.15)',
        'glow-sm': '0 0 10px rgba(99,102,241,0.1)',
        'brand':   '0 0 0 3px rgba(99,102,241,0.15)',
        'brand-sm':'0 0 0 2px rgba(99,102,241,0.2)',
        'inner':   'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '4': '1rem',
        '5': '1.25rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.4' },
          '40%':            { transform: 'scale(1)',   opacity: '1'   },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
      animation: {
        shimmer:       'shimmer 1.6s infinite',
        'fade-in':     'fade-in 0.18s ease-out',
        'fade-in-up':  'fade-in-up 0.3s ease-out',
        'slide-up':    'slide-up 0.22s ease-out',
        'slide-right': 'slide-in-right 0.22s ease-out',
        'slide-left':  'slide-in-left 0.22s ease-out',
        'bounce-dot':  'bounce-dot 1.2s ease-in-out infinite',
        blink:         'blink 1s step-end infinite',
        'pulse-soft':  'pulse-soft 2s ease-in-out infinite',
        'scale-in':    'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
