import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(59, 130, 246, 0.35)"
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(circle at 30% 20%, rgba(59,130,246,0.35), transparent 40%), radial-gradient(circle at 80% 15%, rgba(139,92,246,0.25), transparent 45%)"
      }
    }
  },
  plugins: []
};

export default config;
