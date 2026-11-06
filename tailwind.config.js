/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#182B2A",
        muted: "#586967",
        canvas: "#F5F4EF",
        surface: "#FFFFFF",
        teal: {
          DEFAULT: "#176B63",
          hover: "#11554F",
          light: "#E8F4F2",
        },
        amber: {
          DEFAULT: "#D99A2B",
          light: "#FDF3DC",
        },
        positive: {
          DEFAULT: "#287A55",
          light: "#E8F5EE",
        },
        warning: {
          DEFAULT: "#A96512",
          light: "#FEF3E2",
        },
        negative: {
          DEFAULT: "#B8403A",
          light: "#FDE8E7",
        },
        border: "#D9E0DC",
        focus: "#1D7A70",
        disabled: "#A8B5B2",
      },
    },
  },
  plugins: [],
};
