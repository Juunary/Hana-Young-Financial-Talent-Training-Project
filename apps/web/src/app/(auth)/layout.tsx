import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-neutral-50 flex min-h-screen flex-col">
      <header className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-brand-primary flex h-8 w-8 items-center justify-center rounded-financial text-sm font-bold text-white">
            SF
          </div>
          <span className="text-foreground text-lg font-semibold">Skill Finance Score</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>
      <footer className="text-muted-foreground py-4 text-center text-xs">
        Skill Finance Score는 역량 기반 보완 평가 프로토타입입니다.
      </footer>
    </div>
  );
}
