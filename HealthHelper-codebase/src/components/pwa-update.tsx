"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, RefreshCw, X } from 'lucide-react';

interface UpdateInfo {
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  waitingWorker?: ServiceWorker | null;
}

export function PWAUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    isUpdateAvailable: false,
    isUpdating: false
  });

  useEffect(() => {
    // Listen for service worker update events
    const handleUpdateAvailable = (event: CustomEvent) => {
      setUpdateInfo(prev => ({ 
        ...prev, 
        isUpdateAvailable: true,
        waitingWorker: event.detail?.waitingWorker 
      }));
    };

    // Listen for custom events from service worker registration
    window.addEventListener('sw-update-available', handleUpdateAvailable as EventListener);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable as EventListener);
    };
  }, []);

  const handleUpdate = () => {
    setUpdateInfo(prev => ({ ...prev, isUpdating: true }));
    
    if (updateInfo.waitingWorker) {
      // Tell the waiting service worker to skip waiting
      updateInfo.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else if ('serviceWorker' in navigator) {
      // Fallback: force update
      navigator.serviceWorker.ready.then((registration) => {
        registration.update().then(() => {
          window.location.reload();
        });
      });
    }
  };

  const dismissUpdate = () => {
    setUpdateInfo(prev => ({ ...prev, isUpdateAvailable: false }));
  };

  if (!updateInfo.isUpdateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-gray-900">
                App Update Available
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                A new version of Health Helper is ready to install.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={updateInfo.isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateInfo.isUpdating ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3 mr-1" />
                      Update Now
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismissUpdate}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
