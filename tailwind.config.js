/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        mica: {
          bg:   "#F6F1E8", // warmes Beige
          ink:  "#0F2B27", // sehr dunkles Grün
          brand:"#3E7C71", // Hauptgrün
          brand2:"#2F5E56", // dunkleres Grün
          tint:"#E9E3D8",   // helles Beige
        },
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
      boxShadow: {
        soft: "0 10px 30px rgba(63,120,112,.12)",
        card: "0 4px 14px rgba(15,43,39,.08)"
      },
    },
  },
  plugins: [],
};
