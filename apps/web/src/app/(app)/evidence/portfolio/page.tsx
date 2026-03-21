"use client";

import { FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { FileUploadZone, type UploadedFile } from "@/components/evidence/FileUploadZone";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvidenceStore } from "@/hooks/useEvidenceStore";

interface PortfolioEntry {
  id: string;
  title: string;
  url: string;
  type: string;
  description: string;
  files: UploadedFile[];
}

const TYPE_OPTIONS = ["개인 웹사이트", "Behance/Dribbble", "Notion 포트폴리오", "블로그", "PDF 포트폴리오", "기타"];

const empty: Omit<PortfolioEntry, "id"> = {
  title: "", url: "", type: "개인 웹사이트", description: "", files: [],
};

export default function PortfolioPage() {
  const { items, addItem, updateItem, removeItem } = useEvidenceStore<PortfolioEntry>("portfolio");
  const [editing, setEditing] = useState<Omit<PortfolioEntry, "id"> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => { setEditId(null); setEditing({ ...empty, files: [] }); };
  const openEdit = (item: PortfolioEntry) => { setEditId(item.id); setEditing({ ...item }); };
  const close = () => { setEditing(null); setEditId(null); };

  const save = async () => {
    if (!editing) return;
    if (editId) await updateItem(editId, editing);
    else await addItem(editing);
    close();
  };

  const set = <K extends keyof Omit<PortfolioEntry, "id">>(k: K, v: PortfolioEntry[K]) => {
    if (editing) setEditing({ ...editing, [k]: v });
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="포트폴리오"
        description="포트폴리오 링크 또는 파일을 등록하세요."
        actions={!editing && (
          <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="h-4 w-4" /> 추가</Button>
        )}
      />

      {editing && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editId ? "포트폴리오 수정" : "포트폴리오 추가"}</h3>
              <Button variant="ghost" size="icon" onClick={close}><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>포트폴리오 제목 *</Label>
                <Input placeholder="예: 2024 금융 분석 포트폴리오" value={editing.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>유형</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editing.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL</Label>
              <Input placeholder="https://portfolio.example.com" value={editing.url} onChange={(e) => set("url", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>설명</Label>
              <textarea
                className="flex min-h-25 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="포트폴리오에 포함된 주요 프로젝트나 작업물을 간략히 설명하세요."
                value={editing.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <FileUploadZone
              label="포트폴리오 파일 첨부 (PDF 등)"
              files={editing.files}
              onAdd={(f) => set("files", [...editing.files, f])}
              onRemove={(id) => set("files", editing.files.filter((f) => f.id !== id))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={close}>취소</Button>
              <Button onClick={save} disabled={!editing.title}>{editId ? "수정 완료" : "저장"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && !editing ? (
        <EmptyState icon={<FileText className="h-10 w-10" />} title="등록된 포트폴리오가 없습니다" description="포트폴리오를 추가하면 AI 평가 시 반영됩니다." />
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
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline break-all">
                        {item.url}
                      </a>
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
