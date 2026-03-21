"use client";

import { FileText, FileImage, Trash2, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE_MB = 10;

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadZoneProps {
  files: UploadedFile[];
  onAdd: (file: UploadedFile) => void;
  onRemove: (id: string) => void;
  label?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadZone({
  files,
  onAdd,
  onRemove,
  label = "증빙 파일 첨부",
}: FileUploadZoneProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("허용 형식: PDF, JPG, PNG, DOCX");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`);
      return;
    }

    onAdd({
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <label className="flex cursor-pointer items-center gap-3 rounded-financial border border-dashed border-neutral-300 px-4 py-3 transition-colors hover:border-brand-primary/50 hover:bg-brand-soft-bg/20">
        <Upload className="h-5 w-5 text-neutral-400" />
        <span className="text-sm text-muted-foreground">
          클릭하여 파일 첨부 (PDF, JPG, PNG, DOCX · 최대 {MAX_SIZE_MB}MB)
        </span>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          className="hidden"
          onChange={handleChange}
        />
      </label>
      {error && <p className="text-xs text-semantic-danger">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-financial border border-border bg-card px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                {f.type.startsWith("image/") ? (
                  <FileImage className="h-4 w-4 text-brand-primary shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-brand-primary shrink-0" />
                )}
                <span className="truncate text-sm">{f.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatBytes(f.size)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onRemove(f.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-semantic-danger" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
