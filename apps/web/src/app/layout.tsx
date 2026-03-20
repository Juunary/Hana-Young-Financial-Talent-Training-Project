import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Skill Finance Score",
  description:
    "AI 기반 역량보완 신용평가 프로토타입 - 청년 역량 데이터를 활용한 보완적 신용평가 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
