"use client";

import { useState, useEffect } from "react";
import { SidebarNav } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth/logout";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
type SidebarProps = {
  user: {
    avatar: string | null;
    fullName: string;
  } | null;
};

export function Sidebar({ user }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Close sidebar when pathname changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    router.push("/signup");
    router.refresh();
  }

  // Get user display name
  const displayName = user?.fullName || "User";

  // Get avatar initials for fallback
  const avatarInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <>
      {/* Mobile user avatar button - Hidden when sidebar is open */}
      {!isMobileOpen && (
        <div className="lg:hidden fixed top-0 pt-4 left-0 px-4 z-50 w-full pb-4 border-b flex items-center justify-between bg-background">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="relative w-10 h-10 rounded-full bg-background border border-border shadow-md overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all"
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-sm">
                  {avatarInitials}
                </div>
              )}
            </button>
            <span className="text-md font-medium capitalize">
              {displayName && displayName.length > 20
                ? displayName.slice(0, 20) + "..."
                : displayName}
            </span>
          </div>

          <Button
            variant="outline"
            className="justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <Image
              src="/icons/logout.svg"
              alt="Logout"
              width={16}
              height={16}
            />
            <span>Logout</span>
          </Button>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          h-screen w-64
          bg-background border-r border-border
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:flex items-center justify-center gap-2 px-4 pt-6 pb-2">
            <Image
              src="/logo/logo.svg"
              alt="Logo"
              width={100}
              height={100}
              className="w-fit h-10 mx-auto"
            />
          </div>

          {/* User Info - Mobile - Aligned with page padding */}
          <div className="lg:hidden px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-sm">
                    {avatarInitials}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-md text-foreground truncate">
                  {displayName}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-2 py-4">
            <SidebarNav />
          </div>

          {/* Logout button */}
          <div className="mt-auto pt-4 border-t border-border px-2 pb-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <Image
                src="/icons/logout.svg"
                alt="Logout"
                width={20}
                height={20}
              />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
