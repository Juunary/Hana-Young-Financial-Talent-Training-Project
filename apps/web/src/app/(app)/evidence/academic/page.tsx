"use client";

import { GraduationCap, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { FileUploadZone, type UploadedFile } from "@/components/evidence/FileUploadZone";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvidenceStore } from "@/hooks/useEvidenceStore";

interface AcademicEntry {
  id: string;
  school: string;
  major: string;
  degree: string;
  gpa: string;
  gpaScale: string;
  enrolledAt: string;
  graduatedAt: string;
  status: string;
  keySubjects: string;
  files: UploadedFile[];
}

const DEGREE_OPTIONS = ["학사", "석사", "박사", "전문학사", "기타"];
const STATUS_OPTIONS = ["졸업", "재학", "휴학", "수료", "중퇴"];

const empty: Omit<AcademicEntry, "id"> = {
  school: "",
  major: "",
  degree: "학사",
  gpa: "",
  gpaScale: "4.5",
  enrolledAt: "",
  graduatedAt: "",
  status: "졸업",
  keySubjects: "",
  files: [],
};

export default function AcademicPage() {
  const { items, addItem, updateItem, removeItem } =
    useEvidenceStore<AcademicEntry>("academic");
  const [editing, setEditing] = useState<Omit<AcademicEntry, "id"> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => {
    setEditId(null);
    setEditing({ ...empty, files: [] });
  };
  const openEdit = (item: AcademicEntry) => {
    setEditId(item.id);
    setEditing({ ...item });
  };
  const close = () => {
    setEditing(null);
    setEditId(null);
  };

  const save = async () => {
    if (!editing) return;
    if (editId) {
      await updateItem(editId, editing);
    } else {
      await addItem(editing);
    }
    close();
  };

  const set = <K extends keyof Omit<AcademicEntry, "id">>(
    key: K,
    value: AcademicEntry[K],
  ) => {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="학업 기록"
        description="학교, 전공, 학점 등 학업 정보를 입력하세요."
        actions={
          !editing && (
            <Button size="sm" onClick={openNew} className="gap-1.5">
              <Plus className="h-4 w-4" /> 추가
            </Button>
          )
        }
      />

      {/* ── Form ── */}
      {editing && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {editId ? "학업 기록 수정" : "학업 기록 추가"}
              </h3>
              <Button variant="ghost" size="icon" onClick={close}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>학교명 *</Label>
                <Input
                  placeholder="예: 한양대학교"
                  value={editing.school}
                  onChange={(e) => set("school", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>전공 *</Label>
                <Input
                  placeholder="예: 경영학과"
                  value={editing.major}
                  onChange={(e) => set("major", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>학위</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editing.degree}
                  onChange={(e) => set("degree", e.target.value)}
                >
                  {DEGREE_OPTIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>학점 (GPA)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="3.7"
                    value={editing.gpa}
                    onChange={(e) => set("gpa", e.target.value)}
                    className="flex-1"
                  />
                  <select
                    className="flex h-10 w-20 rounded-md border border-input bg-background px-2 text-sm"
                    value={editing.gpaScale}
                    onChange={(e) => set("gpaScale", e.target.value)}
                  >
                    <option value="4.5">/ 4.5</option>
                    <option value="4.3">/ 4.3</option>
                    <option value="4.0">/ 4.0</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editing.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>입학일</Label>
                <Input
                  type="month"
                  value={editing.enrolledAt}
                  onChange={(e) => set("enrolledAt", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>졸업(예정)일</Label>
                <Input
                  type="month"
                  value={editing.graduatedAt}
                  onChange={(e) => set("graduatedAt", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>주요 이수 과목</Label>
              <Input
                placeholder="예: 재무관리, 투자론, 파생상품론 (쉼표로 구분)"
                value={editing.keySubjects}
                onChange={(e) => set("keySubjects", e.target.value)}
              />
            </div>

            <FileUploadZone
              label="성적 증명서 / 졸업 증명서 첨부"
              files={editing.files}
              onAdd={(f) => set("files", [...editing.files, f])}
              onRemove={(id) =>
                set("files", editing.files.filter((f) => f.id !== id))
              }
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={close}>
                취소
              </Button>
              <Button onClick={save} disabled={!editing.school || !editing.major}>
                {editId ? "수정 완료" : "저장"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── List ── */}
      {items.length === 0 && !editing ? (
        <EmptyState
          icon={<GraduationCap className="h-10 w-10" />}
          title="등록된 학업 기록이 없습니다"
          description="학업 정보를 추가하면 AI 평가 시 반영됩니다."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.school}</p>
                      <span className="rounded-full bg-brand-soft-bg px-2 py-0.5 text-xs font-medium text-brand-primary">
                        {item.degree}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-muted-foreground">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.major}
                      {item.gpa && ` · GPA ${item.gpa}/${item.gpaScale}`}
                    </p>
                    {(item.enrolledAt || item.graduatedAt) && (
                      <p className="text-xs text-muted-foreground">
                        {item.enrolledAt} ~ {item.graduatedAt || "현재"}
                      </p>
                    )}
                    {item.keySubjects && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.keySubjects.split(",").map((s) => (
                          <span
                            key={s.trim()}
                            className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.files.length > 0 && (
                      <p className="text-xs text-brand-primary pt-1">
                        첨부파일 {item.files.length}개
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-semantic-danger" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
