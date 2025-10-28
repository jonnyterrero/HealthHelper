"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, HeartPulse, Sparkles, Brain, Apple, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home, color: "blue" },
  { href: "/analytics", label: "Analytics", icon: Activity, color: "blue" },
  { href: "/lifestyle", label: "Lifestyle", icon: Apple, color: "green" },
  { href: "/skintrack", label: "SkinTrack+", icon: Sparkles, color: "purple" },
  { href: "/gastro", label: "GastroGuard", icon: HeartPulse, color: "red" },
  { href: "/mindtrack", label: "MindMap", icon: Brain, color: "orange" },
];

export const MobileTabs = () => {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-gradient-to-r from-blue-50/95 via-pink-50/95 to-purple-50/95 backdrop-blur supports-[backdrop-filter]:bg-gradient-to-r from-blue-50/80 via-pink-50/80 to-purple-50/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
      role="navigation"
    >
      <ul className="grid grid-cols-6">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-xs transition-all duration-200",
                  active 
                    ? "text-primary bg-white/20 rounded-lg mx-1 shadow-lg" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg mx-1"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};