/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#131A24",
        sand: "#F2EDE3",
        mint: "#A7E8BD",
        coral: "#F06A57",
        ocean: "#2A5266",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        soft: "0 16px 40px rgba(19, 26, 36, 0.12)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.55s ease-out both",
      },
    },
  },
  plugins: [],
};
