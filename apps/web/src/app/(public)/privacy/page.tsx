export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-foreground text-3xl font-bold">개인정보 처리방침</h1>
      <p className="text-muted-foreground mt-2 text-sm">최종 수정일: 2026년 3월 20일</p>

      <div className="text-muted-foreground mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-foreground text-lg font-semibold">1. 수집하는 개인정보</h2>
          <p className="mt-2">
            본 서비스는 다음의 개인정보를 수집합니다: 이메일 주소, 이름, 출생 연도, 학력 정보,
            경력 정보, 자격증 정보, GitHub 공개 프로필 데이터. 주민등록번호, 계좌번호 등 민감한
            금융 정보는 수집하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">2. 수집 목적</h2>
          <p className="mt-2">
            AI 기반 역량 평가 서비스 제공, 평가 결과 생성 및 표시, 서비스 개선을 위한 익명화된
            통계 분석 (동의 시).
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">3. 보관 기간</h2>
          <p className="mt-2">
            회원 탈퇴 시 즉시 삭제됩니다. AI 평가 원본 응답(raw_ai_response)은 90일 후 자동
            삭제됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">4. 제3자 제공</h2>
          <p className="mt-2">
            수집된 개인정보는 제3자에게 제공되지 않습니다. AI 평가를 위해 Anthropic Claude API에
            역량 데이터가 전송되며, 이때 이메일/이름 등 직접 식별 정보는 포함되지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-lg font-semibold">5. 보안 조치</h2>
          <p className="mt-2">
            비밀번호는 argon2id로 해시 처리되며, 모든 통신은 HTTPS로 암호화됩니다. 세션은
            서버 사이드(Redis)에서 관리되며, HTTP-Only 쿠키를 사용합니다.
          </p>
        </section>

        <div className="bg-brand-soft-bg rounded-financial border border-brand-mint-border p-4">
          <p className="text-brand-primary-strong">
            본 문서는 프로토타입 서비스를 위한 것이며, 실제 서비스 출시 시 법률 검토를 거쳐
            정식 개인정보 처리방침으로 대체됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
