import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-border flex h-16 items-center justify-between border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-brand-primary flex h-8 w-8 items-center justify-center rounded-financial text-sm font-bold text-white">
            SF
          </div>
          <span className="text-foreground text-lg font-semibold">Skill Finance Score</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/about" className="text-muted-foreground text-sm hover:text-foreground">
            서비스 소개
          </Link>
          <Link
            href="/auth/login"
            className="bg-brand-primary hover:bg-brand-primary-strong rounded-financial px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            로그인
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-border border-t px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-muted-foreground text-xs">
            Skill Finance Score는 역량 기반 보완 평가 프로토타입입니다.
          </p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="text-muted-foreground text-xs hover:underline">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="text-muted-foreground text-xs hover:underline">
              이용약관
            </Link>
            <Link href="/disclaimer" className="text-muted-foreground text-xs hover:underline">
              법적 고지
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
