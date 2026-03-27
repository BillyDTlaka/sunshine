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
        brand: {
          DEFAULT: '#8B3A3A',
          dark: '#5C1A1A',
          light: '#f5d0d0',
          50: '#fdf2f2',
          100: '#fce4e4',
          200: '#f5d0d0',
          500: '#8B3A3A',
          600: '#7a3030',
          700: '#5C1A1A',
        },
        status: {
          pending: '#D97706',
          confirmed: '#2563EB',
          approved: '#059669',
          rejected: '#DC2626',
          draft: '#6B7280',
          active: '#059669',
          inactive: '#D97706',
          paid: '#059669',
          overdue: '#DC2626',
          issued: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
