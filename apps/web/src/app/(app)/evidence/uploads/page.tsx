"use client";

import { useState } from "react";
import { Upload, Trash2, FileText, FileImage } from "lucide-react";

import { PageTitle } from "@/components/layout/PageTitle";
import { EmptyState } from "@/components/common/EmptyState";
import { AlertNotice } from "@/components/common/AlertNotice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_LABELS = "PDF, JPG, PNG, DOCX";
const MAX_SIZE_MB = 10;

interface UploadedFile {
  id: number;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <FileImage className="h-5 w-5 text-brand-primary" />;
  return <FileText className="h-5 w-5 text-brand-primary" />;
}

export default function UploadsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`허용되지 않는 파일 형식입니다. 허용 형식: ${ALLOWED_LABELS}`);
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`파일 크기는 ${MAX_SIZE_MB}MB를 초과할 수 없습니다.`);
      return;
    }

    setUploading(true);
    // TODO: POST /api/v1/uploads/presign → get upload_url + file_id
    // TODO: PUT upload_url with file
    // TODO: POST /api/v1/uploads/complete with file_id
    await new Promise((r) => setTimeout(r, 800));
    setFiles([
      ...files,
      {
        id: Date.now(),
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        created_at: new Date().toISOString(),
      },
    ]);
    setUploading(false);
    e.target.value = "";
  }

  function handleDelete(id: number) {
    // TODO: DELETE /api/v1/uploads/:id
    setFiles(files.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="파일 업로드"
        description="성적 증명서, 수료증 등 증빙 자료를 업로드하세요."
      />

      <AlertNotice variant="info">
        허용 파일: {ALLOWED_LABELS} · 파일당 최대 {MAX_SIZE_MB}MB
      </AlertNotice>

      <Card>
        <CardContent className="pt-6">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-financial border-2 border-dashed border-neutral-200 p-8 text-center transition-colors hover:border-brand-primary/50 hover:bg-brand-soft-bg/30">
            <Upload className="h-8 w-8 text-neutral-300" />
            <div>
              <p className="font-medium text-sm">파일을 클릭하여 업로드</p>
              <p className="text-xs text-neutral-500 mt-1">{ALLOWED_LABELS} · 최대 {MAX_SIZE_MB}MB</p>
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading && (
              <p className="text-sm text-brand-primary">업로드 중...</p>
            )}
          </label>
        </CardContent>
      </Card>

      {error && <AlertNotice variant="danger">{error}</AlertNotice>}

      {files.length === 0 ? (
        <EmptyState
          icon={<Upload className="h-10 w-10" />}
          title="업로드된 파일이 없습니다"
          description="증빙 자료를 업로드하면 AI 평가 시 참고됩니다."
        />
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileIcon mimeType={file.mime_type} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.original_filename}</p>
                    <p className="text-xs text-neutral-500">{formatBytes(file.file_size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => handleDelete(file.id)}
                >
                  <Trash2 className="h-4 w-4 text-semantic-danger" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
