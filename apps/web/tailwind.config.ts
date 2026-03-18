/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ZonaSur Design Token System (zs-*)
        'zs-bg-primary':   '#0d1117',
        'zs-bg-secondary': '#161b22',
        'zs-bg-surface':   '#1c2128',
        'zs-bg-hover':     '#21262d',
        'zs-border':       '#30363d',

        'zs-text-primary':   '#e6edf3',
        'zs-text-secondary': '#8b949e',
        'zs-text-muted':     '#484f58',

        'zs-accent':       '#58a6ff',
        'zs-accent-hover': '#79c0ff',
        'zs-accent-muted': '#1f3a5f',

        'zs-success': '#3fb950',
        'zs-warning': '#d29922',
        'zs-danger':  '#f85149',

        // Chat-specific
        'zs-bubble-out':  '#1a3154',
        'zs-bubble-in':   '#1c2128',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'zs-glow-blue': '0 0 16px rgba(88, 166, 255, 0.15)',
        'zs-card':      '0 1px 3px rgba(0,0,0,0.4)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%':           { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in':   'fade-in 0.15s ease-out',
        'pulse-dot': 'pulse-dot 1.4s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}
