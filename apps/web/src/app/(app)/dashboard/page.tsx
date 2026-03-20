import { PageTitle } from "@/components/layout/PageTitle";

export default function DashboardPage() {
  return (
    <div>
      <PageTitle title="대시보드" description="역량 평가 현황을 한눈에 확인하세요" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-financial border border-border bg-card p-6">
          <p className="text-muted-foreground text-sm font-medium">입력된 역량 데이터</p>
          <p className="mt-2 text-3xl font-bold">0 / 8</p>
          <p className="text-muted-foreground mt-1 text-xs">카테고리</p>
        </div>

        <div className="rounded-financial border border-border bg-card p-6">
          <p className="text-muted-foreground text-sm font-medium">완료된 평가</p>
          <p className="mt-2 text-3xl font-bold">0</p>
          <p className="text-muted-foreground mt-1 text-xs">건</p>
        </div>

        <div className="rounded-financial border border-border bg-card p-6">
          <p className="text-muted-foreground text-sm font-medium">최근 점수</p>
          <p className="text-muted-foreground mt-2 text-3xl font-bold">-</p>
          <p className="text-muted-foreground mt-1 text-xs">아직 평가 없음</p>
        </div>

        <div className="rounded-financial border border-border bg-card p-6">
          <p className="text-muted-foreground text-sm font-medium">증명 기록</p>
          <p className="mt-2 text-3xl font-bold">0</p>
          <p className="text-muted-foreground mt-1 text-xs">건</p>
        </div>
      </div>

      <div className="bg-brand-soft-bg text-brand-primary-strong mt-6 rounded-financial border border-brand-mint-border p-4 text-sm">
        <strong>시작하기:</strong> 왼쪽 메뉴에서 역량 데이터를 입력한 후 AI 평가를 요청하세요.
      </div>
    </div>
  );
}
