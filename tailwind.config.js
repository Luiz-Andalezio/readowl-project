/* eslint-disable */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'readowl-purple': {
          DEFAULT: '#6750A4',
          light: '#9E85E0',
          dark: '#2F0959',
          extradark: '#23004B',
          extralight: '#F0EAFF'
        },
        'readowl-purple-medium': '#836DBE',
        'readowl-purple-hover': '#A78CF0' //'#AD92F5'
      },
      fontFamily: {
        yusei: ['var(--font-yusei-magic)', 'system-ui', 'sans-serif'],
        ptserif: ['var(--font-pt-serif)', 'serif']
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};