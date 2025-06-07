/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/app/components/**/*.{js,ts,jsx,tsx}',
    './src/app/(send-message|create-group|add-friends|register)/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}; 