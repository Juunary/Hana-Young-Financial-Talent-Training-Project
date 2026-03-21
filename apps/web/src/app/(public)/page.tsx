import Link from "next/link";

import { DemoLoginButton } from "@/components/DemoLoginButton";

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-neutral-50 px-6 py-20 text-center">
        <h1 className="text-brand-primary text-4xl font-bold tracking-tight sm:text-5xl">
          당신의 역량이
          <br />
          <span className="text-foreground">금융 가치가 됩니다</span>
        </h1>
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">
          학점, 프로젝트, 인턴 경험, 자격증, GitHub 활동 등 청년의 실질적 역량을 AI가
          구조화·해석하여 보완적 신용평가 점수를 산출합니다.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <DemoLoginButton />
          <Link
            href="/about"
            className="border-border text-foreground hover:bg-neutral-100 rounded-financial border px-8 py-3 text-base font-semibold transition-colors"
          >
            자세히 알아보기
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-foreground text-center text-2xl font-bold">평가 흐름</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-brand-soft-bg text-brand-primary mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold">
                1
              </div>
              <h3 className="text-foreground mt-4 text-lg font-semibold">역량 데이터 입력</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                학업, 프로젝트, 인턴, 자격증, GitHub 등 8가지 카테고리의 역량 데이터를 입력합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-brand-soft-bg text-brand-primary mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold">
                2
              </div>
              <h3 className="text-foreground mt-4 text-lg font-semibold">AI 분석 및 평가</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                PydanticAI 기반 3단계 파이프라인이 역량을 정규화·채점·설명합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-brand-soft-bg text-brand-primary mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold">
                3
              </div>
              <h3 className="text-foreground mt-4 text-lg font-semibold">결과 확인</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                점수, 팩터 분석, 개선 추천, 대출 범위 시뮬레이션을 확인합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-neutral-50 px-6 py-8 text-center">
        <p className="text-muted-foreground text-sm">
          본 서비스는 프로토타입 시뮬레이션이며, 실제 금융기관의 신용평가와 무관합니다.
        </p>
      </section>
    </div>
  );
}
