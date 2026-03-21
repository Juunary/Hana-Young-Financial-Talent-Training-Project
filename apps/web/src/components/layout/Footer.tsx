export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-100 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          <span>Skill Finance Score</span>
          <span>·</span>
          <span>운영: Hana Young 금융인재교육</span>
          <span>·</span>
          <span>이용약관</span>
          <span>·</span>
          <span>개인정보처리방침</span>
          <span>·</span>
          <span>고지사항</span>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          본 서비스는 프로토타입 시뮬레이션으로, 실제 금융기관의 신용평가 및 채용 결과와 무관합니다.
          입력하신 정보는 시뮬레이션 목적으로만 사용되며, 외부에 제공되지 않습니다.
        </p>
        <p className="text-xs text-neutral-400">© 2025 Hana Young. All rights reserved.</p>
      </div>
    </footer>
  );
}
