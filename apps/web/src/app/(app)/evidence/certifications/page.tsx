"use client";

import { Award, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { FileUploadZone, type UploadedFile } from "@/components/evidence/FileUploadZone";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvidenceStore } from "@/hooks/useEvidenceStore";

interface CertEntry {
  id: string;
  name: string;
  issuer: string;
  acquiredAt: string;
  expiresAt: string;
  score: string;
  certNumber: string;
  files: UploadedFile[];
}

const empty: Omit<CertEntry, "id"> = {
  name: "", issuer: "", acquiredAt: "", expiresAt: "", score: "", certNumber: "", files: [],
};

export default function CertificationsPage() {
  const { items, addItem, updateItem, removeItem } = useEvidenceStore<CertEntry>("certifications");
  const [editing, setEditing] = useState<Omit<CertEntry, "id"> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => { setEditId(null); setEditing({ ...empty, files: [] }); };
  const openEdit = (item: CertEntry) => { setEditId(item.id); setEditing({ ...item }); };
  const close = () => { setEditing(null); setEditId(null); };

  const save = async () => {
    if (!editing) return;
    if (editId) await updateItem(editId, editing);
    else await addItem(editing);
    close();
  };

  const set = <K extends keyof Omit<CertEntry, "id">>(k: K, v: CertEntry[K]) => {
    if (editing) setEditing({ ...editing, [k]: v });
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="자격증"
        description="취득한 자격증 및 어학 시험 성적을 입력하세요."
        actions={!editing && (
          <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="h-4 w-4" /> 추가</Button>
        )}
      />

      {editing && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editId ? "자격증 수정" : "자격증 추가"}</h3>
              <Button variant="ghost" size="icon" onClick={close}><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>자격증/시험명 *</Label>
                <Input placeholder="예: 금융투자분석사, TOEIC" value={editing.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>발급 기관 *</Label>
                <Input placeholder="예: 금융투자협회, ETS" value={editing.issuer} onChange={(e) => set("issuer", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>취득일</Label>
                <Input type="date" value={editing.acquiredAt} onChange={(e) => set("acquiredAt", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>만료일 (해당 시)</Label>
                <Input type="date" value={editing.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>점수/등급 (해당 시)</Label>
                <Input placeholder="예: 950점, 1급" value={editing.score} onChange={(e) => set("score", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>자격증 번호</Label>
              <Input placeholder="자격증 번호 (선택)" value={editing.certNumber} onChange={(e) => set("certNumber", e.target.value)} />
            </div>

            <FileUploadZone
              label="자격증 사본 / 성적표 첨부"
              files={editing.files}
              onAdd={(f) => set("files", [...editing.files, f])}
              onRemove={(id) => set("files", editing.files.filter((f) => f.id !== id))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={close}>취소</Button>
              <Button onClick={save} disabled={!editing.name || !editing.issuer}>{editId ? "수정 완료" : "저장"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && !editing ? (
        <EmptyState icon={<Award className="h-10 w-10" />} title="등록된 자격증이 없습니다" description="자격증 정보를 추가하면 AI 평가 시 반영됩니다." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.name}</p>
                      {item.score && <span className="rounded-full bg-brand-soft-bg px-2 py-0.5 text-xs font-medium text-brand-primary">{item.score}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.issuer}</p>
                    <p className="text-xs text-muted-foreground">
                      취득: {item.acquiredAt}
                      {item.expiresAt && ` · 만료: ${item.expiresAt}`}
                    </p>
                    {item.certNumber && <p className="text-xs text-muted-foreground">No. {item.certNumber}</p>}
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
