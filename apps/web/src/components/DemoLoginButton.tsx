"use client";

import { useRouter } from "next/navigation";
import { enableDemoMode } from "@/lib/demo-data";

export function DemoLoginButton() {
  const router = useRouter();

  const handleClick = () => {
    enableDemoMode();
    router.push("/dashboard");
  };

  return (
    <button
      onClick={handleClick}
      className="bg-brand-primary hover:bg-brand-primary-strong rounded-financial px-8 py-3 text-base font-semibold text-white transition-colors"
    >
      무료로 시작하기
    </button>
  );
}
