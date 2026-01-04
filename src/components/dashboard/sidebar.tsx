"use client";

import { useState, useEffect } from "react";
import { SidebarNav } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth/logout";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export function Sidebar() {
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

  return (
    <>
      {/* Mobile user avatar button - Hidden when sidebar is open */}
      {!isMobileOpen && (
        <div className="lg:hidden fixed top-0 pt-6 left-0 px-4 z-50 w-full pb-5 border-b flex items-center justify-between bg-background">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo/logo.svg"
              alt="Logo"
              width={100}
              height={100}
              className="w-fit h-8 mx-auto"
            />
          </Link>

          <button
            className="justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            <Image src="/icons/menu.svg" alt="Menu" width={24} height={24} />
          </button>
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
          <div className="lg:hidden px-4 pt-6 pb-5 border-b border-border">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo/logo.svg"
                alt="Logo"
                width={100}
                height={100}
                className="w-fit h-8 mx-auto"
              />
            </Link>
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
