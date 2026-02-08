module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bgStart: "#4a5568",
        bgEnd: "#805ad5",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        ui: ["var(--font-ui)"],
      },
      fontWeight: {
        regular: "var(--font-weight-regular)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold: "var(--font-weight-bold)",
      },
      letterSpacing: {
        body: "var(--tracking-body)",
        label: "var(--tracking-label)",
        tight: "var(--tracking-tight)",
        normal: "var(--tracking-normal)",
        wide: "var(--tracking-wide)",
        mythic: "var(--tracking-mythic)",
      },
      fontSize: {
        display: ["var(--type-display-size)", { lineHeight: "1.08" }],
        h1: ["var(--type-h1-size)", { lineHeight: "1.2" }],
        h2: ["var(--type-h2-size)", { lineHeight: "1.25" }],
        h3: ["var(--type-h3-size)", { lineHeight: "1.3" }],
        body: ["var(--type-body-size)", { lineHeight: "1.55" }],
        label: ["var(--type-label-size)", { lineHeight: "1.2" }],
        caption: ["var(--type-caption-size)", { lineHeight: "1.3" }],
        metric: ["var(--type-metric-size)", { lineHeight: "1" }],
      },
    },
  },
  plugins: [],
};
