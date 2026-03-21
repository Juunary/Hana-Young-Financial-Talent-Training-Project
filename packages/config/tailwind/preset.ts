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
          "50": "#F5F6F7",   // page background
          "100": "#ECEEF0",  // surface / muted bg
          "200": "#D1D5DB",  // border / divider (더 선명)
          "300": "#9CA3AF",  // placeholder / disabled text
          "500": "#6B7280",  // secondary text
          "700": "#374151",  // primary text (부드럽게)
          "900": "#111827",  // darkest text
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
        "financial-xs": "2px",   // 최소 (상태 배지)
        "financial-sm": "4px",   // 버튼 / 입력창
        financial: "6px",        // 기본 (카드 border-first)
        "financial-md": "8px",   // 패널
        "financial-lg": "12px",  // 모달 / 시트
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.05)",
        panel: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "panel-md": "0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)",
      },
      fontSize: {
        "banking-xs": ["11px", { lineHeight: "1.5" }],
        "banking-sm": ["12px", { lineHeight: "1.5" }],
        "banking-base": ["13px", { lineHeight: "1.6" }],
        "banking-md": ["14px", { lineHeight: "1.6" }],
        "banking-lg": ["16px", { lineHeight: "1.5" }],
      },
    },
  },
};
