"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Sparkles, Download, Plug, User } from "lucide-react";
import { loadSampleData } from "@/lib/sampleData";
import { exportCSV, exportPDF } from "@/lib/export";
import Link from "next/link";
import { ProfileMenu } from "@/components/profile-menu";
import { loadEntries, generateInsights } from "@/lib/health";

export function SettingsDialog() {
  const [entries, setEntries] = React.useState(() => loadEntries());
  
  // Refresh entries when dialog opens or regularly to ensure export is fresh
  React.useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const handleLoadSampleData = () => {
    if (confirm("This will overwrite your current data. Are you sure?")) {
        const sampleData = loadSampleData();
        setEntries(sampleData); // Update local state
        window.location.reload();
    }
  };

  const insights = React.useMemo(() => generateInsights(entries), [entries]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="lg" className="w-full justify-start gap-3 text-slate-600 hover:text-purple-700 hover:bg-purple-50/50 rounded-2xl">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel rounded-3xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>App Settings</DialogTitle>
          <DialogDescription>
            Manage your data, profile, and integrations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Data Management</h4>
            <Button 
                variant="outline" 
                onClick={handleLoadSampleData}
                className="w-full justify-start rounded-xl border-white/50 bg-white/50 hover:bg-white/80"
            >
                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                Load Sample Data
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Export</h4>
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => exportCSV(entries)} className="rounded-xl border-white/50 bg-white/50 hover:bg-white/80">
                    <Download className="w-4 h-4 mr-2" /> CSV
                </Button>
                <Button variant="outline" onClick={() => exportPDF(entries, insights)} className="rounded-xl border-white/50 bg-white/50 hover:bg-white/80">
                    <Download className="w-4 h-4 mr-2" /> PDF
                </Button>
            </div>
            <Button asChild variant="outline" className="w-full justify-start rounded-xl border-white/50 bg-white/50 hover:bg-white/80">
                <Link href="/api/export-zip">
                    <Download className="w-4 h-4 mr-2" /> Download Full Backup (ZIP)
                </Link>
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Connect</h4>
            <Button asChild variant="outline" className="w-full justify-start rounded-xl border-white/50 bg-white/50 hover:bg-white/80">
                <Link href="/integrations">
                    <Plug className="w-4 h-4 mr-2" /> Integrations
                </Link>
            </Button>
          </div>

          <div className="pt-4 border-t border-white/30">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profile</span>
                <ProfileMenu />
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

