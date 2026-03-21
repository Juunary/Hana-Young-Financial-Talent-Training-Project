"use client";

import { BookOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { FileUploadZone, type UploadedFile } from "@/components/evidence/FileUploadZone";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvidenceStore } from "@/hooks/useEvidenceStore";

interface EducationEntry {
  id: string;
  title: string;
  institution: string;
  type: string;
  startDate: string;
  endDate: string;
  hours: string;
  description: string;
  certificateUrl: string;
  files: UploadedFile[];
}

const TYPE_OPTIONS = ["온라인 강의", "부트캠프", "세미나/컨퍼런스", "사내 교육", "자율 학습", "기타"];

const empty: Omit<EducationEntry, "id"> = {
  title: "", institution: "", type: "온라인 강의", startDate: "", endDate: "",
  hours: "", description: "", certificateUrl: "", files: [],
};

export default function EducationPage() {
  const { items, addItem, updateItem, removeItem } = useEvidenceStore<EducationEntry>("education");
  const [editing, setEditing] = useState<Omit<EducationEntry, "id"> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => { setEditId(null); setEditing({ ...empty, files: [] }); };
  const openEdit = (item: EducationEntry) => { setEditId(item.id); setEditing({ ...item }); };
  const close = () => { setEditing(null); setEditId(null); };

  const save = async () => {
    if (!editing) return;
    if (editId) await updateItem(editId, editing);
    else await addItem(editing);
    close();
  };

  const set = <K extends keyof Omit<EducationEntry, "id">>(k: K, v: EducationEntry[K]) => {
    if (editing) setEditing({ ...editing, [k]: v });
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="교육 이수"
        description="수강한 강의, 부트캠프, 세미나 등 교육 이력을 입력하세요."
        actions={!editing && (
          <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="h-4 w-4" /> 추가</Button>
        )}
      />

      {editing && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editId ? "교육 수정" : "교육 추가"}</h3>
              <Button variant="ghost" size="icon" onClick={close}><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>교육명 *</Label>
                <Input placeholder="예: 금융 데이터 분석 과정" value={editing.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>교육 기관 *</Label>
                <Input placeholder="예: Coursera, 패스트캠퍼스" value={editing.institution} onChange={(e) => set("institution", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>교육 유형</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editing.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input type="month" value={editing.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input type="month" value={editing.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>총 이수 시간</Label>
                <Input placeholder="예: 40시간" value={editing.hours} onChange={(e) => set("hours", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>수료증 URL (해당 시)</Label>
                <Input placeholder="https://" value={editing.certificateUrl} onChange={(e) => set("certificateUrl", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>교육 내용</Label>
              <textarea
                className="flex min-h-25 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="학습한 주요 내용, 습득한 기술 등을 작성하세요."
                value={editing.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <FileUploadZone
              label="수료증 / 이수 증명서 첨부"
              files={editing.files}
              onAdd={(f) => set("files", [...editing.files, f])}
              onRemove={(id) => set("files", editing.files.filter((f) => f.id !== id))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={close}>취소</Button>
              <Button onClick={save} disabled={!editing.title || !editing.institution}>{editId ? "수정 완료" : "저장"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && !editing ? (
        <EmptyState icon={<BookOpen className="h-10 w-10" />} title="등록된 교육 이력이 없습니다" description="교육 이력을 추가하면 AI 평가 시 반영됩니다." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.title}</p>
                      <span className="rounded-full bg-brand-soft-bg px-2 py-0.5 text-xs font-medium text-brand-primary">{item.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.institution}{item.hours && ` · ${item.hours}`}</p>
                    {(item.startDate || item.endDate) && (
                      <p className="text-xs text-muted-foreground">{item.startDate} ~ {item.endDate}</p>
                    )}
                    {item.description && <p className="text-sm text-muted-foreground pt-1 line-clamp-2">{item.description}</p>}
                    {item.files.length > 0 && <p className="text-xs text-brand-primary pt-1">첨부파일 {item.files.length}개</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)}><Trash2 className="h-3.5 w-3.5 text-semantic-danger" /></Button>
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
