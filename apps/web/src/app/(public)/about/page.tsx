export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-foreground text-3xl font-bold">서비스 소개</h1>

      <div className="text-muted-foreground mt-8 space-y-6 text-base leading-relaxed">
        <p>
          <strong className="text-foreground">Skill Finance Score</strong>는 기존 금융권
          신용평가가 반영하지 못하는 청년층의 실질적 역량을 AI로 분석하여 보완적 신용평가 점수를
          산출하는 프로토타입 서비스입니다.
        </p>

        <h2 className="text-foreground text-xl font-semibold">대상 사용자</h2>
        <p>대학생, 휴학생, 취업준비생, 사회초년생 등 기존 신용 이력이 부족한 청년층</p>

        <h2 className="text-foreground text-xl font-semibold">평가 항목 (7개 팩터)</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>학업 역량 (학점, 전공 관련성)</li>
          <li>프로젝트 깊이 (기술적 난이도, 결과물)</li>
          <li>실무 경험 (인턴십, 대외활동)</li>
          <li>자격/인증 (자격증 수준, 관련성)</li>
          <li>포트폴리오 (품질, 다양성)</li>
          <li>GitHub 활동 (기여 지속성, 프로젝트 품질)</li>
          <li>일관성/완성도 (데이터 완결성, 서사 일관성)</li>
        </ul>

        <h2 className="text-foreground text-xl font-semibold">AI 평가 파이프라인</h2>
        <p>
          PydanticAI 기반 3-Agent 파이프라인(정규화 → 채점 → 설명)이 구조화된 출력과 규칙 기반
          보완을 통해 신뢰할 수 있는 평가를 제공합니다.
        </p>

        <div className="bg-brand-soft-bg rounded-financial border border-brand-mint-border p-4">
          <p className="text-brand-primary-strong text-sm">
            본 서비스는 프로토타입이며, 실제 금융기관의 신용평가를 대체하지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
