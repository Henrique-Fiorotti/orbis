/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "poppins": "var(--font-poppins)",
        "open-sans": "var(--font-open-sans)",
      },
    },
  },
  plugins: [],
};
