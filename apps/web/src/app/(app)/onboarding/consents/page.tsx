"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiClientError } from "@/lib/api-client";

interface ConsentItem {
  type: string;
  version: string;
  label: string;
  description: string;
  required: boolean;
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    type: "privacy",
    version: "1.0",
    label: "개인정보 처리방침 동의",
    description: "서비스 이용을 위한 개인정보 수집·이용에 동의합니다.",
    required: true,
  },
  {
    type: "evaluation",
    version: "1.0",
    label: "AI 평가 활용 동의",
    description: "입력된 역량 데이터를 AI 평가에 활용하는 것에 동의합니다.",
    required: true,
  },
  {
    type: "data_usage",
    version: "1.0",
    label: "데이터 활용 동의 (선택)",
    description: "서비스 개선을 위한 익명화된 데이터 활용에 동의합니다.",
    required: false,
  },
];

export default function ConsentsPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allRequiredAccepted = CONSENT_ITEMS.filter((c) => c.required).every(
    (c) => accepted[c.type],
  );

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      for (const item of CONSENT_ITEMS) {
        if (accepted[item.type]) {
          await api.post("/api/v1/consents", {
            consent_type: item.type,
            consent_version: item.version,
            accepted: true,
          });
        }
      }
      router.push("/onboarding/profile");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("동의 처리에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="서비스 이용 동의" description="서비스 이용을 위해 아래 항목에 동의해주세요" />

      {error && (
        <div className="bg-semantic-danger/10 text-semantic-danger mb-4 rounded-financial px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {CONSENT_ITEMS.map((item) => (
          <Card key={item.type}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={item.type}
                  checked={accepted[item.type] ?? false}
                  onChange={(e) =>
                    setAccepted((prev) => ({ ...prev, [item.type]: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded accent-brand-primary"
                />
                <div>
                  <CardTitle className="text-base">
                    {item.label}
                    {item.required && <span className="text-semantic-danger ml-1">*</span>}
                  </CardTitle>
                  <CardDescription className="mt-1">{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <button
                type="button"
                className="text-brand-primary text-xs hover:underline"
                onClick={() => {
                  if (item.type === "privacy") window.open("/privacy", "_blank");
                  if (item.type === "evaluation") window.open("/terms", "_blank");
                }}
              >
                자세히 보기
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSubmit} disabled={!allRequiredAccepted || loading}>
          {loading ? "처리 중..." : "동의하고 계속하기"}
        </Button>
      </div>
    </div>
  );
}
