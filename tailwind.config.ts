import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'lc-dark': '#1a1a2e',
        'lc-darker': '#0f0f1a',
        'lc-card': '#1e1e3a',
        'lc-border': '#2d2d5e',
        'lc-orange': '#ffa116',
        'lc-green': '#00b8a3',
        'lc-red': '#ef4743',
        'lc-yellow': '#ffb800',
        'neon-orange': '#ff6b00',
        'neon-green': '#39ff14',
        'neon-purple': '#bf00ff',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 161, 22, 0.5), 0 0 20px rgba(255, 161, 22, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 161, 22, 0.8), 0 0 40px rgba(255, 161, 22, 0.4)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
