"use client";

import { LogOut, Menu, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api-client";
import { disableDemoMode, isDemoMode } from "@/lib/demo-data";

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export function Header({ userName, userEmail, onMenuToggle, showMenuButton = true }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (isDemoMode()) {
      disableDemoMode();
      router.push("/");
      return;
    }
    try {
      await api.post("/api/v1/auth/logout");
    } catch {
      // Continue even if API fails
    }
    router.push("/auth/login");
  };

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="border-border bg-card sticky top-0 z-50 flex h-16 items-center border-b px-4 lg:px-6">
      <div className="flex flex-1 items-center gap-4">
        {showMenuButton && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-brand-primary flex h-8 w-8 items-center justify-center rounded-financial text-sm font-bold text-white">
            SF
          </div>
          <span className="text-foreground hidden text-lg font-semibold sm:inline-block">
            Skill Finance Score
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-brand-soft-bg text-brand-primary text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="flex items-center gap-2 p-2">
              <div className="flex flex-col space-y-1">
                {userName && <p className="text-sm font-medium leading-none">{userName}</p>}
                {userEmail && (
                  <p className="text-muted-foreground text-xs leading-none">{userEmail}</p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/onboarding/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                프로필 설정
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-semantic-danger">
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
