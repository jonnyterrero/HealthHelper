"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner"

export type SharedProfile = {
  age?: number;
  gender?: "male" | "female" | "non-binary" | "prefer-not-to-say";
  weight?: string; // free text (e.g., "70 kg" or "155 lb")
  conditions: string[];
  medications: string[];
  emergencyContact?: string;
  notes?: string;
};

const STORAGE_KEY = "orchids.profile.v1";

function loadSharedProfile(): SharedProfile {
  if (typeof window === "undefined") return { conditions: [], medications: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") return { conditions: [], medications: [], ...parsed };
    return { conditions: [], medications: [] };
  } catch {
    return { conditions: [], medications: [] };
  }
}

function saveSharedProfile(p: SharedProfile) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

export const ProfileMenu: React.FC<{ buttonLabel?: string } & React.HTMLAttributes<HTMLDivElement>> = ({ buttonLabel = "Profile", className }) => {
  const [open, setOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<SharedProfile>(() => loadSharedProfile());

  React.useEffect(() => {
    // hydrate in case other tabs/pages updated it
    const p = loadSharedProfile();
    setProfile(p);
  }, []);

  function save() {
    saveSharedProfile(profile);
    setOpen(false);
    toast.success("Profile saved")
  }

  function clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setProfile({ conditions: [], medications: [] });
    setOpen(false);
    toast.success("Profile cleared")
  }

  return (
    <div className={className + " relative"}>
      <Button className="bg-pink-100 text-pink-700 hover:bg-pink-200" onClick={() => setOpen((o) => !o)}>{buttonLabel}</Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border bg-card text-card-foreground shadow-lg p-4 z-50">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Profile</h3>
            <Button variant="ghost" className="h-8 px-2" onClick={() => setOpen(false)}>Close</Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="space-y-1">
              <Label>Age</Label>
              <Input type="number" min={0} value={profile.age ?? ""} onChange={(e) => setProfile((p) => ({ ...p, age: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1">
              <Label>Gender</Label>
              <Select value={profile.gender} onValueChange={(v) => setProfile((p) => ({ ...p, gender: v as SharedProfile["gender"] }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Weight (kg or lb)</Label>
              <Input value={profile.weight || ""} onChange={(e) => setProfile((p) => ({ ...p, weight: e.target.value }))} placeholder="e.g., 70 kg" />
            </div>
            <div className="space-y-1">
              <Label>Known conditions (comma-separated)</Label>
              <Input value={(profile.conditions || []).join(", ")} onChange={(e) => setProfile((p) => ({ ...p, conditions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} />
            </div>
            <div className="space-y-1">
              <Label>Medications (comma-separated)</Label>
              <Input value={(profile.medications || []).join(", ")} onChange={(e) => setProfile((p) => ({ ...p, medications: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} />
            </div>
            <div className="space-y-1">
              <Label>Emergency contact</Label>
              <Input value={profile.emergencyContact || ""} onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: e.target.value }))} placeholder="Name • relation • phone" />
            </div>
            <div className="space-y-1">
              <Label>Other info</Label>
              <Input value={profile.notes || ""} onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))} placeholder="Allergies, physician, goals..." />
            </div>
            <div className="pt-2 flex gap-2">
              <Button className="bg-pink-200 text-pink-900 hover:bg-pink-300" onClick={save}>Save</Button>
              <Button variant="outline" className="border-pink-300 text-pink-700 hover:bg-pink-50" onClick={clear}>Clear</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};