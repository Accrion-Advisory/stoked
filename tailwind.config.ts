import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        'bg-base': '#0A0B0F',
        'bg-surface': '#111318',
        'bg-elevated': '#171A20',
        green: { stoked: '#21D07A' },
        red: { stoked: '#FF5C7A' },
        blue: { stoked: '#5B8CFF' },
        gold: { stoked: '#F6C453' },
      },
      borderRadius: { xl: '16px', '2xl': '20px' },
      animation: {
        'sheet-up': 'sheetUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
}

export default config
