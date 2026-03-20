export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-foreground text-3xl font-bold">이용약관</h1>
      <p className="text-muted-foreground mt-2 text-sm">최종 수정일: 2026년 3월 20일</p>

      <div className="text-muted-foreground mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-foreground text-lg font-semibold">제1조 (목적)</h2>
          <p className="mt-2">
            본 약관은 Skill Finance Score 프로토타입 서비스(이하 &quot;서비스&quot;)의 이용 조건 및
            절차에 관한 사항을 규정합니다.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">제2조 (서비스의 성격)</h2>
          <p className="mt-2">
            본 서비스는 교육·연구 목적의 프로토타입으로, 실제 금융기관의 신용평가를 대체하지
            않으며, 평가 결과는 어떠한 금융 거래의 근거로도 사용될 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">제3조 (이용자의 의무)</h2>
          <p className="mt-2">
            이용자는 정확한 정보를 입력해야 하며, 타인의 정보를 도용하여 서비스를 이용할 수
            없습니다. 평가 결과를 실제 금융 심사 자료로 제출하거나 오용하는 것을 금지합니다.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">제4조 (면책 사항)</h2>
          <p className="mt-2">
            서비스 제공자는 AI 평가 결과의 정확성, 완전성, 적시성에 대해 보증하지 않습니다. 평가
            결과를 바탕으로 한 어떠한 의사결정에 대해서도 책임을 지지 않습니다.
          </p>
        </section>

        <div className="bg-brand-soft-bg rounded-financial border border-brand-mint-border p-4">
          <p className="text-brand-primary-strong">
            본 약관은 프로토타입 서비스를 위한 것이며, 법적 구속력이 없습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
