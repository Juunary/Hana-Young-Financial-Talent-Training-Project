"use client";

import { FolderGit2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { FileUploadZone, type UploadedFile } from "@/components/evidence/FileUploadZone";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvidenceStore } from "@/hooks/useEvidenceStore";

interface ProjectEntry {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  ongoing: boolean;
  techStack: string;
  description: string;
  link: string;
  teamSize: string;
  files: UploadedFile[];
}

const empty: Omit<ProjectEntry, "id"> = {
  name: "",
  role: "",
  startDate: "",
  endDate: "",
  ongoing: false,
  techStack: "",
  description: "",
  link: "",
  teamSize: "",
  files: [],
};

export default function ProjectsPage() {
  const { items, addItem, updateItem, removeItem } =
    useEvidenceStore<ProjectEntry>("projects");
  const [editing, setEditing] = useState<Omit<ProjectEntry, "id"> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => { setEditId(null); setEditing({ ...empty, files: [] }); };
  const openEdit = (item: ProjectEntry) => { setEditId(item.id); setEditing({ ...item }); };
  const close = () => { setEditing(null); setEditId(null); };

  const save = async () => {
    if (!editing) return;
    if (editId) await updateItem(editId, editing);
    else await addItem(editing);
    close();
  };

  const set = <K extends keyof Omit<ProjectEntry, "id">>(k: K, v: ProjectEntry[K]) => {
    if (editing) setEditing({ ...editing, [k]: v });
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="프로젝트 경험"
        description="참여한 프로젝트, 역할, 사용 기술을 입력하세요."
        actions={!editing && (
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> 추가
          </Button>
        )}
      />

      {editing && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editId ? "프로젝트 수정" : "프로젝트 추가"}</h3>
              <Button variant="ghost" size="icon" onClick={close}><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>프로젝트명 *</Label>
                <Input placeholder="예: 금융 데이터 분석 플랫폼" value={editing.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>역할 *</Label>
                <Input placeholder="예: 백엔드 개발, PM" value={editing.role} onChange={(e) => set("role", e.target.value)} />
              </div>
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
                  진행 중
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>팀 규모</Label>
                <Input placeholder="예: 4명" value={editing.teamSize} onChange={(e) => set("teamSize", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>링크 (GitHub, 배포 URL 등)</Label>
                <Input placeholder="https://" value={editing.link} onChange={(e) => set("link", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>기술 스택</Label>
              <Input placeholder="예: React, FastAPI, PostgreSQL (쉼표로 구분)" value={editing.techStack} onChange={(e) => set("techStack", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>프로젝트 설명</Label>
              <textarea
                className="flex min-h-25 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="프로젝트 목적, 주요 기여 사항, 성과 등을 작성하세요."
                value={editing.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <FileUploadZone
              label="관련 자료 첨부 (발표자료, 보고서 등)"
              files={editing.files}
              onAdd={(f) => set("files", [...editing.files, f])}
              onRemove={(id) => set("files", editing.files.filter((f) => f.id !== id))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={close}>취소</Button>
              <Button onClick={save} disabled={!editing.name || !editing.role}>{editId ? "수정 완료" : "저장"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && !editing ? (
        <EmptyState icon={<FolderGit2 className="h-10 w-10" />} title="등록된 프로젝트가 없습니다" description="프로젝트 경험을 추가하면 AI 평가 시 반영됩니다." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.role}{item.teamSize && ` · ${item.teamSize}`}</p>
                    <p className="text-xs text-muted-foreground">{item.startDate} ~ {item.ongoing ? "진행 중" : item.endDate}</p>
                    {item.techStack && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.techStack.split(",").map((t) => (
                          <span key={t.trim()} className="rounded-full bg-brand-soft-bg px-2 py-0.5 text-xs text-brand-primary">{t.trim()}</span>
                        ))}
                      </div>
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
