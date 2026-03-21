"use client";

import { Briefcase, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { FileUploadZone, type UploadedFile } from "@/components/evidence/FileUploadZone";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvidenceStore } from "@/hooks/useEvidenceStore";

interface InternshipEntry {
  id: string;
  company: string;
  department: string;
  position: string;
  startDate: string;
  endDate: string;
  ongoing: boolean;
  tasks: string;
  achievements: string;
  files: UploadedFile[];
}

const empty: Omit<InternshipEntry, "id"> = {
  company: "", department: "", position: "", startDate: "", endDate: "",
  ongoing: false, tasks: "", achievements: "", files: [],
};

export default function InternshipsPage() {
  const { items, addItem, updateItem, removeItem } = useEvidenceStore<InternshipEntry>("internships");
  const [editing, setEditing] = useState<Omit<InternshipEntry, "id"> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => { setEditId(null); setEditing({ ...empty, files: [] }); };
  const openEdit = (item: InternshipEntry) => { setEditId(item.id); setEditing({ ...item }); };
  const close = () => { setEditing(null); setEditId(null); };

  const save = async () => {
    if (!editing) return;
    if (editId) await updateItem(editId, editing);
    else await addItem(editing);
    close();
  };

  const set = <K extends keyof Omit<InternshipEntry, "id">>(k: K, v: InternshipEntry[K]) => {
    if (editing) setEditing({ ...editing, [k]: v });
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="인턴/경력 경험"
        description="인턴십, 아르바이트 등 실무 경험을 입력하세요."
        actions={!editing && (
          <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="h-4 w-4" /> 추가</Button>
        )}
      />

      {editing && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editId ? "경험 수정" : "경험 추가"}</h3>
              <Button variant="ghost" size="icon" onClick={close}><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>회사/기관명 *</Label>
                <Input placeholder="예: 하나금융그룹" value={editing.company} onChange={(e) => set("company", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>부서</Label>
                <Input placeholder="예: 디지털금융본부" value={editing.department} onChange={(e) => set("department", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>직무/직책 *</Label>
              <Input placeholder="예: 데이터 분석 인턴" value={editing.position} onChange={(e) => set("position", e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input type="month" value={editing.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input type="month" value={editing.endDate} onChange={(e) => set("endDate", e.target.value)} disabled={editing.ongoing} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.ongoing} onChange={(e) => set("ongoing", e.target.checked)} className="rounded" />
                  재직 중
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>주요 업무</Label>
              <textarea
                className="flex min-h-25 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="담당했던 주요 업무를 작성하세요."
                value={editing.tasks}
                onChange={(e) => set("tasks", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>성과/결과</Label>
              <textarea
                className="flex min-h-25 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="구체적 성과나 수치를 포함하면 좋습니다. (예: 분석 보고서 10건 작성, 데이터 파이프라인 구축)"
                value={editing.achievements}
                onChange={(e) => set("achievements", e.target.value)}
              />
            </div>

            <FileUploadZone
              label="재직 증명서 / 경력 증명서 첨부"
              files={editing.files}
              onAdd={(f) => set("files", [...editing.files, f])}
              onRemove={(id) => set("files", editing.files.filter((f) => f.id !== id))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={close}>취소</Button>
              <Button onClick={save} disabled={!editing.company || !editing.position}>{editId ? "수정 완료" : "저장"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && !editing ? (
        <EmptyState icon={<Briefcase className="h-10 w-10" />} title="등록된 경험이 없습니다" description="인턴십, 실무 경험을 추가하면 AI 평가 시 반영됩니다." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{item.company}</p>
                    <p className="text-sm text-muted-foreground">{item.position}{item.department && ` · ${item.department}`}</p>
                    <p className="text-xs text-muted-foreground">{item.startDate} ~ {item.ongoing ? "재직 중" : item.endDate}</p>
                    {item.tasks && <p className="text-sm text-muted-foreground pt-1 line-clamp-2">{item.tasks}</p>}
                    {item.achievements && <p className="text-sm text-brand-primary pt-1 line-clamp-1">{item.achievements}</p>}
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
