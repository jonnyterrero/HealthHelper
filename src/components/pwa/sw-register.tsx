"use client";

import { useEffect } from "react";

export const SwRegister = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Listen for updates and activate immediately
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New content available; you could show a toast. For now, just log.
              console.info("A new version is available. It will be used next time you open the app.");
            }
          });
        });
      } catch (err) {
        console.warn("SW registration failed", err);
      }
    };

    // Register after page load for reliability
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("load", register as any);
    };
  }, []);

  return null;
};

export default SwRegister;