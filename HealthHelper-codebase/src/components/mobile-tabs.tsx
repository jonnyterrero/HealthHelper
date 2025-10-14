"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, HeartPulse, Sparkles, Brain, Dumbbell, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/analytics", label: "Insights", icon: Activity },
  { href: "/lifestyle", label: "Lifestyle", icon: Dumbbell },
  { href: "/skintrack", label: "Skin", icon: Sparkles },
  { href: "/gastro", label: "Gastro", icon: HeartPulse },
  { href: "/mindtrack", label: "MindMap", icon: Brain },
  { href: "/sleeptrack", label: "Sleep", icon: Moon },
];

export const MobileTabs = () => {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
      role="navigation"
    >
      <ul className="grid grid-cols-7">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-xs",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};