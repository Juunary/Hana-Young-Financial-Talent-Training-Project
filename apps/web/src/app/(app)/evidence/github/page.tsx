"use client";

import { Github, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvidenceStore } from "@/hooks/useEvidenceStore";

interface GithubEntry {
  id: string;
  username: string;
  profileUrl: string;
  bio: string;
  mainLanguages: string;
  pinnedRepos: string;
  contributions: string;
}

const empty: Omit<GithubEntry, "id"> = {
  username: "", profileUrl: "", bio: "", mainLanguages: "",
  pinnedRepos: "", contributions: "",
};

export default function GithubPage() {
  const { items, addItem, updateItem, removeItem } = useEvidenceStore<GithubEntry>("github");
  const [editing, setEditing] = useState<Omit<GithubEntry, "id"> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => { setEditId(null); setEditing({ ...empty }); };
  const openEdit = (item: GithubEntry) => { setEditId(item.id); setEditing({ ...item }); };
  const close = () => { setEditing(null); setEditId(null); };

  const save = async () => {
    if (!editing) return;
    const data = {
      ...editing,
      profileUrl: editing.profileUrl || `https://github.com/${editing.username}`,
    };
    if (editId) await updateItem(editId, data);
    else await addItem(data);
    close();
  };

  const set = <K extends keyof Omit<GithubEntry, "id">>(k: K, v: GithubEntry[K]) => {
    if (editing) setEditing({ ...editing, [k]: v });
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="GitHub 프로필"
        description="GitHub 계정을 연결하여 개발 활동을 보여주세요."
        actions={!editing && items.length === 0 && (
          <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="h-4 w-4" /> 연결</Button>
        )}
      />

      {editing && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editId ? "GitHub 정보 수정" : "GitHub 계정 연결"}</h3>
              <Button variant="ghost" size="icon" onClick={close}><X className="h-4 w-4" /></Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>GitHub 사용자명 *</Label>
                <Input placeholder="예: juunary" value={editing.username} onChange={(e) => set("username", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>프로필 URL</Label>
                <Input
                  placeholder="https://github.com/username"
                  value={editing.profileUrl}
                  onChange={(e) => set("profileUrl", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>소개 (Bio)</Label>
              <Input placeholder="GitHub 프로필 소개 문구" value={editing.bio} onChange={(e) => set("bio", e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>주요 사용 언어</Label>
                <Input placeholder="예: Python, TypeScript, Go (쉼표로 구분)" value={editing.mainLanguages} onChange={(e) => set("mainLanguages", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>연간 기여 횟수 (대략)</Label>
                <Input placeholder="예: 500+ contributions" value={editing.contributions} onChange={(e) => set("contributions", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>주요 레포지토리 (Pinned)</Label>
              <textarea
                className="flex min-h-25 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="주요 프로젝트 레포를 한 줄씩 작성 (예: my-project - 설명)"
                value={editing.pinnedRepos}
                onChange={(e) => set("pinnedRepos", e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={close}>취소</Button>
              <Button onClick={save} disabled={!editing.username}>{editId ? "수정 완료" : "저장"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && !editing ? (
        <EmptyState icon={<Github className="h-10 w-10" />} title="GitHub 계정이 연결되지 않았습니다" description="GitHub 프로필을 연결하면 개발 활동이 AI 평가에 반영됩니다." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Github className="h-5 w-5" />
                      <p className="font-semibold">{item.username}</p>
                      {item.contributions && (
                        <span className="rounded-full bg-brand-soft-bg px-2 py-0.5 text-xs font-medium text-brand-primary">
                          {item.contributions}
                        </span>
                      )}
                    </div>
                    {item.profileUrl && (
                      <a href={item.profileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline">
                        {item.profileUrl}
                      </a>
                    )}
                    {item.bio && <p className="text-sm text-muted-foreground">{item.bio}</p>}
                    {item.mainLanguages && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.mainLanguages.split(",").map((lang) => (
                          <span key={lang.trim()} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{lang.trim()}</span>
                        ))}
                      </div>
                    )}
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
