"use client";

import { useEffect } from "react";

export const SwRegister = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        console.log("Service Worker registered:", reg);
        
        // Check for updates every 2 minutes
        setInterval(() => {
          reg.update();
        }, 2 * 60 * 1000);

        // Listen for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New content available - notify the PWA update component
              window.dispatchEvent(new CustomEvent('sw-update-available', { 
                detail: { waitingWorker: newWorker } 
              }));
            }
          });
        });

        // Check if there's already a waiting worker
        if (reg.waiting) {
          window.dispatchEvent(new CustomEvent('sw-update-available', { 
            detail: { waitingWorker: reg.waiting } 
          }));
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

  return null; // This component only handles registration, UI is handled by PWAUpdate
};

export default SwRegister;