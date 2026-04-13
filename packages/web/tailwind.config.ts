import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0d0f11',
          surface: '#141618',
          elevated: '#1a1d20',
        },
        accent: {
          intel: '#1d9e75',
          block: '#ba7517',
          alert: '#d4537e',
          trust: '#3b8bd4',
          roi: '#8b5cf6',
        },
        text: {
          primary: '#e8e6e0',
          secondary: '#7a7870',
          muted: '#4a4845',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      borderColor: {
        subtle: 'rgba(255, 255, 255, 0.07)',
        DEFAULT: 'rgba(255, 255, 255, 0.12)',
        strong: 'rgba(255, 255, 255, 0.20)',
      },
    },
  },
  plugins: [],
} satisfies Config
