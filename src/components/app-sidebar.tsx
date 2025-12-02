"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsDialog } from "./settings-dialog";
import { cn } from "@/lib/utils";
import { 
    Activity, TrendingUp, Apple, Dumbbell, Leaf, 
    Sparkles, HeartPulse, Brain, Moon, LayoutDashboard,
    Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadEntries, generateInsights, lastNDays } from "@/lib/health";
import { Badge } from "@/components/ui/badge";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Activity, label: "Analytics", href: "/analytics" },
    { icon: TrendingUp, label: "Predictions", href: "/predictions" },
    { icon: Apple, label: "Nutrition", href: "/nutrition" },
    { icon: Dumbbell, label: "Exercise", href: "/exercise" },
    { icon: Leaf, label: "Remedies", href: "/remedies" },
    { icon: Sparkles, label: "SkinTrack+", href: "/skintrack" },
    { icon: HeartPulse, label: "GastroGuard", href: "/gastro" },
    { icon: Brain, label: "MindTrack", href: "/mindtrack" },
    { icon: Moon, label: "SleepTrack", href: "/sleeptrack" },
];

export function AppSidebar() {
    const pathname = usePathname();
    const [entries] = React.useState(() => loadEntries());
    
    // Simple insights logic for the sidebar
    const insights = React.useMemo(() => {
        const allInsights = generateInsights(entries);
        // Sort by score/priority and take top 3
        return allInsights.slice(0, 3);
    }, [entries]);

    // Simple Recent Activity summary (e.g. last 7 days stats)
    const recentSummary = React.useMemo(() => {
        const recent = lastNDays(entries, 7);
        if (recent.length === 0) return null;
        const avgMood = recent.reduce((s, e) => s + (e.mental?.mood || 0), 0) / recent.length;
        const avgSleep = recent.reduce((s, e) => s + (e.mental?.sleepHours || 0), 0) / recent.length;
        return { avgMood, avgSleep };
    }, [entries]);

    return (
        <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 p-4 gap-4 overflow-hidden">
            {/* Logo Area */}
            <div className="glass-panel rounded-3xl p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    <Activity className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100">HealthHelper</h1>
                    <p className="text-xs text-muted-foreground">Your AI Companion</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="glass-panel rounded-3xl p-4 flex-1 flex flex-col gap-2 overflow-y-auto no-scrollbar">
                <div className="space-y-1">
                    <h3 className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Health Services
                    </h3>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <span className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200",
                                    isActive 
                                        ? "bg-purple-100/80 text-purple-700 font-semibold shadow-sm" 
                                        : "text-slate-600 hover:bg-white/50 hover:text-slate-900"
                                )}>
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-purple-600" : "text-slate-400")} />
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>

                {/* Recent Activity / Insights Section */}
                <div className="mt-6 space-y-3 px-2">
                    <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Recent Insights
                    </h3>
                    {insights.length > 0 ? (
                        <div className="space-y-2">
                            {insights.map((ins, i) => (
                                <div key={i} className="bg-white/40 rounded-2xl p-3 border border-white/50 text-xs space-y-1">
                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                        <Zap className="w-3 h-3 text-amber-500" />
                                        {ins.area}
                                    </div>
                                    <p className="text-slate-600 line-clamp-2 leading-tight">{ins.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground px-2">No recent insights available.</div>
                    )}

                    {recentSummary && (
                         <div className="bg-purple-50/50 rounded-2xl p-3 border border-purple-100/50 text-xs mt-4">
                            <h4 className="font-semibold text-purple-800 mb-2">7-Day Avg</h4>
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-600">Mood</span>
                                <span className="font-medium">{recentSummary.avgMood.toFixed(1)}/10</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Sleep</span>
                                <span className="font-medium">{recentSummary.avgSleep.toFixed(1)}h</span>
                            </div>
                         </div>
                    )}
                </div>
            </div>

            {/* Settings / Bottom Action */}
            <div className="glass-panel rounded-3xl p-2">
                <SettingsDialog />
            </div>
        </aside>
    );
}

