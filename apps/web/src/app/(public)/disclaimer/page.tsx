export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-foreground text-3xl font-bold">프로토타입 한계 및 법적 고지</h1>

      <div className="text-muted-foreground mt-8 space-y-6 text-sm leading-relaxed">
        <div className="bg-semantic-warning/10 border-semantic-warning/30 rounded-financial border p-4">
          <p className="text-semantic-warning font-semibold">
            본 서비스는 프로토타입 시뮬레이션이며, 실제 금융기관의 신용평가와 무관합니다.
          </p>
        </div>

        <section>
          <h2 className="text-foreground text-lg font-semibold">프로토타입 한계</h2>
          <ul className="mt-2 list-inside list-disc space-y-2">
            <li>AI 평가 결과는 실제 금융 심사 자료로 사용할 수 없습니다.</li>
            <li>대출 가능 금액 범위는 시뮬레이션 수치이며, 실제 대출과 무관합니다.</li>
            <li>AI 모델의 출력은 비결정적일 수 있으며, 환각(hallucination)이 포함될 수 있습니다.</li>
            <li>증명 기록(Proof Record)은 프로토타입 환경에서 생성된 것으로, 공인 문서가 아닙니다.</li>
            <li>서비스의 가용성, 연속성, 데이터 보전을 보장하지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">비구현 범위</h2>
          <ul className="mt-2 list-inside list-disc space-y-2">
            <li>실제 은행 계좌조회, 이체, 잔액 조회</li>
            <li>실제 대출 실행, 승인, 여신 심사</li>
            <li>실제 금융상품 가입</li>
            <li>블록체인, NFT, SBT, 스마트컨트랙트</li>
            <li>실명 확인 체계</li>
            <li>인증서/공인인증</li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">면책 조항</h2>
          <p className="mt-2">
            서비스 제공자는 본 프로토타입 서비스의 이용으로 인해 발생하는 어떠한 직접적, 간접적,
            부수적, 특별, 결과적 손해에 대해서도 책임을 지지 않습니다. 본 서비스의 모든 결과물은
            교육·연구 목적으로만 제공됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}
