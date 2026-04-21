/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)', 'var(--font-dm-sans)', 'sans-serif'],
      },
      colors: {
        'region-writing':      '#6366f1',
        'region-code':         '#06b6d4',
        'region-personal':     '#f59e0b',
        'region-academic':     '#10b981',
        'region-creative':     '#ec4899',
        'region-professional': '#8b5cf6',
      },
      scale: { '102': '1.02' },
    },
  },
  plugins: [],
};
