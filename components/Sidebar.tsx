"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FolderGit2, Send, Telescope } from "lucide-react";

const NAV = [
  { href: "/", label: "Projects", icon: FolderGit2, match: (p: string) => p === "/" || p.startsWith("/projects") },
  { href: "/scout", label: "Scout", icon: Telescope, match: (p: string) => p.startsWith("/scout") },
  { href: "/posts", label: "Posts", icon: Send, match: (p: string) => p.startsWith("/posts") },
  { href: "/analytics", label: "Analytics", icon: BarChart3, match: (p: string) => p.startsWith("/analytics") },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-screen w-[208px] bg-card border-r border-border flex flex-col z-40">
      <div className="px-5 py-6 border-b border-border">
        <Link href="/" className="block">
          <div className="font-head font-bold text-[20px] tracking-tightest leading-none">
            CLIP<span className="text-accent">ENGINE</span>
          </div>
          <div className="font-body text-[10px] uppercase tracking-widest text-muted mt-2">
            v0.1 — solo studio
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.match(path);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group flex items-center gap-3 px-3 py-2.5 rounded-sm font-head uppercase tracking-wider text-xs transition",
                active
                  ? "bg-accent text-bg"
                  : "text-text hover:bg-bg hover:text-accent",
              ].join(" ")}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border">
        <div className="font-body text-[10px] uppercase tracking-widest text-muted">
          One operator. Many streamers.
        </div>
      </div>
    </aside>
  );
}
