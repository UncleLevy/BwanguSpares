import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function NetworkBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 md:top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
      <WifiOff className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-sm">You're offline</p>
        <p className="text-xs opacity-90">Waiting for connection...</p>
      </div>
    </div>
  );
}