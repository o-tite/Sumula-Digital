import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Saint Clair palette
        primary: {
          50: "#E6F4FB",
          200: "#99CFEA",
          500: "#0088CC",
          700: "#0069A8",
          900: "#004F80"
        },
        ink: {
          DEFAULT: "#0D1117",
          800: "#1C2333"
        },
        surface: {
          50: "#F4F5F7",
          100: "#E2E4E8"
        },
        muted: {
          DEFAULT: "#6B7280"
        },
        alert: "#E87722",
        danger: "#E24B4A",
        success: "#00CC88"
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
