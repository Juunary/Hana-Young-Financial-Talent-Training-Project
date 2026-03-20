"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiClientError } from "@/lib/api-client";

const GRADUATION_OPTIONS = [
  { value: "enrolled", label: "재학 중" },
  { value: "on_leave", label: "휴학 중" },
  { value: "graduated", label: "졸업" },
  { value: "expected", label: "졸업 예정" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "student", label: "학생" },
  { value: "job_seeker", label: "취업준비생" },
  { value: "employed", label: "재직 중" },
  { value: "freelancer", label: "프리랜서" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    birth_year: "",
    university: "",
    major: "",
    graduation_status: "",
    employment_status: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.patch("/api/v1/me", {
        name: form.name || undefined,
        birth_year: form.birth_year ? parseInt(form.birth_year) : undefined,
        university: form.university || undefined,
        major: form.major || undefined,
        graduation_status: form.graduation_status || undefined,
        employment_status: form.employment_status || undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("프로필 저장에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="프로필 설정" description="기본 정보를 입력해주세요 (나중에 수정 가능)" />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-semantic-danger/10 text-semantic-danger rounded-financial px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="홍길동"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_year">출생 연도</Label>
                <Input
                  id="birth_year"
                  type="number"
                  value={form.birth_year}
                  onChange={(e) => updateField("birth_year", e.target.value)}
                  placeholder="1999"
                  min={1950}
                  max={2010}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="university">대학교</Label>
                <Input
                  id="university"
                  value={form.university}
                  onChange={(e) => updateField("university", e.target.value)}
                  placeholder="OO대학교"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">전공</Label>
                <Input
                  id="major"
                  value={form.major}
                  onChange={(e) => updateField("major", e.target.value)}
                  placeholder="컴퓨터공학과"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="graduation_status">학적 상태</Label>
                <select
                  id="graduation_status"
                  value={form.graduation_status}
                  onChange={(e) => updateField("graduation_status", e.target.value)}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="">선택하세요</option>
                  {GRADUATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_status">취업 상태</Label>
                <select
                  id="employment_status"
                  value={form.employment_status}
                  onChange={(e) => updateField("employment_status", e.target.value)}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="">선택하세요</option>
                  {EMPLOYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                건너뛰기
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "저장 중..." : "저장하고 시작하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
