"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const SwRegister = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        
        // Check for updates every 60 seconds
        setInterval(() => {
          reg.update();
        }, 60000);

        // Listen for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New content available
              setUpdateAvailable(true);
              setWaitingWorker(newWorker);
            }
          });
        });

        // Handle messages from SW
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "SW_UPDATED") {
            setUpdateAvailable(true);
            setWaitingWorker(reg.waiting);
          }
        });

        // Check if there's already a waiting worker
        if (reg.waiting) {
          setUpdateAvailable(true);
          setWaitingWorker(reg.waiting);
        }

      } catch (err) {
        console.warn("SW registration failed", err);
      }
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("load", register as any);
    };
  }, []);

  const handleUpdate = () => {
    if (!waitingWorker) return;
    
    // Tell the waiting worker to skip waiting and become active
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    
    // Reload the page to use the new service worker
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm w-[calc(100%-2rem)]">
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm">Update Available</h3>
          <p className="text-xs text-muted-foreground">
            A new version of HealthHelper is ready. Update now for the latest features and improvements.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleUpdate}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
            size="sm"
          >
            Update Now
          </Button>
          <Button 
            onClick={() => setUpdateAvailable(false)}
            variant="outline"
            size="sm"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SwRegister;