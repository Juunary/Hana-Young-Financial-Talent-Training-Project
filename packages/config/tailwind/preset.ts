export const skillFinancePreset = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#00857A",
          "primary-strong": "#006C63",
          secondary: "#4CB7A5",
          "soft-bg": "#EAF7F4",
          "mint-border": "#B9DFD8",
        },
        neutral: {
          "0": "#FFFFFF",
          "50": "#F6F8F8",
          "100": "#EEF2F2",
          "200": "#D9E3E1",
          "300": "#B8C5C2",
          "500": "#667572",
          "700": "#2C3736",
          "900": "#172120",
        },
        semantic: {
          success: "#1F9D6A",
          warning: "#C98A00",
          danger: "#D9534F",
          info: "#2F6FED",
        },
        score: {
          excellent: "#1F9D6A",
          good: "#4CB7A5",
          average: "#C98A00",
          low: "#D97706",
          poor: "#D9534F",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Noto Sans KR",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        financial: "8px",
      },
    },
  },
};
