"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shuffle,
  Sparkle,
  Table2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "coach", label: "Coach", icon: Sparkle },
  { id: "matchups", label: "Matchups", icon: Table2 },
  { id: "optimizer", label: "Trade", icon: Shuffle },
  { id: "waivers", label: "Waivers", icon: Users },
] as const;

type NavId = (typeof NAV_ITEMS)[number]["id"];

export default function MobileBottomNav() {
  const [active, setActive] = useState<NavId>("dashboard");

  const handleTap = useCallback((id: NavId) => {
    setActive(id);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => ({
      id: item.id,
      el: document.getElementById(`section-${item.id}`),
    })).filter((s) => s.el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const match = sections.find((s) => s.el === entry.target);
            if (match) setActive(match.id as NavId);
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    for (const s of sections) {
      if (s.el) observer.observe(s.el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTap(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
