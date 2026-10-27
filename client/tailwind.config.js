/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wechat: {
          green: '#95EC69',
          bg: '#EDEDED',
          sidebar: '#F7F7F7',
        },
      },
    },
  },
  plugins: [],
};
