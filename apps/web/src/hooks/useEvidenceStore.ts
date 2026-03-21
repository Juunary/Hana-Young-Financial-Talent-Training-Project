"use client";

import { useCallback, useEffect, useState } from "react";

import { isDemoMode } from "@/lib/demo-data";
import { api } from "@/lib/api-client";

/**
 * 로컬스토리지 기반 evidence 항목 관리 훅.
 * 데모 모드에서는 localStorage, 실제 환경에서는 API를 호출한다.
 */
export function useEvidenceStore<T extends { id: string }>(category: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const storageKey = `evidence_${category}`;

  // load
  useEffect(() => {
    if (isDemoMode()) {
      const stored = localStorage.getItem(storageKey);
      setItems(stored ? JSON.parse(stored) : []);
      setLoading(false);
    } else {
      api
        .get<{ items: T[] }>(`/api/v1/evidence/${category}`)
        .then((res) => setItems(res.items ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }
  }, [category, storageKey]);

  const persist = useCallback(
    (next: T[]) => {
      setItems(next);
      if (isDemoMode()) {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
    },
    [storageKey],
  );

  const addItem = useCallback(
    async (item: Omit<T, "id">) => {
      const newItem = { ...item, id: `${category}-${Date.now()}` } as T;
      if (!isDemoMode()) {
        try {
          const res = await api.post<{ id: string }>(
            `/api/v1/evidence/${category}`,
            item,
          );
          (newItem as T & { id: string }).id = res.id;
        } catch {
          // fallback
        }
      }
      persist([...items, newItem]);
      return newItem;
    },
    [category, items, persist],
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>) => {
      const next = items.map((it) =>
        it.id === id ? { ...it, ...updates } : it,
      );
      if (!isDemoMode()) {
        try {
          await api.patch(`/api/v1/evidence/${category}/${id}`, updates);
        } catch {
          // fallback
        }
      }
      persist(next);
    },
    [category, items, persist],
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!isDemoMode()) {
        try {
          await api.delete(`/api/v1/evidence/${category}/${id}`);
        } catch {
          // fallback
        }
      }
      persist(items.filter((it) => it.id !== id));
    },
    [category, items, persist],
  );

  return { items, loading, addItem, updateItem, removeItem };
}
