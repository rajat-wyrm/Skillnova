import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from './auth';

// 30 seconds
const HEARTBEAT_INTERVAL = 30000; 

export function useActivityTracker() {
  const { pathname } = useLocation();
  const { sessionId } = useAuthStore();
  const intervalRef = useRef(null);
  const entryTimeRef = useRef(Date.now());
  const currentRouteRef = useRef(pathname);

  // Function to send page exit event
  const sendPageExit = () => {
    if (!sessionId) return;
    
    const exitedAt = Date.now();
    const timeSpentSeconds = Math.floor((exitedAt - entryTimeRef.current) / 1000);
    const route = currentRouteRef.current;
    
    const payload = JSON.stringify({
      sessionId,
      route,
      pageTitle: document.title,
      enteredAt: new Date(entryTimeRef.current).toISOString(),
      exitedAt: new Date(exitedAt).toISOString(),
      timeSpentSeconds
    });

    // Use sendBeacon for reliable delivery on unload
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/v1/telemetry/page-event', blob);
  };

  useEffect(() => {
    if (!sessionId) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Heartbeat ping
    const pingHeartbeat = () => {
      fetch('/api/v1/telemetry/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      }).catch(() => {}); // ignore network errors
    };

    // Initial ping and setup interval
    pingHeartbeat();
    intervalRef.current = setInterval(pingHeartbeat, HEARTBEAT_INTERVAL);

    // Global event listeners for browser closing/tab change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pingHeartbeat();
      }
    };

    const handleBeforeUnload = () => {
      sendPageExit();
      // Also end session beacon
      const endPayload = JSON.stringify({ sessionId, exitType: 'TAB_CLOSE' });
      const blob = new Blob([endPayload], { type: 'application/json' });
      navigator.sendBeacon('/api/v1/telemetry/end-session', blob);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId]);

  // Route change tracker
  useEffect(() => {
    if (!sessionId) return;
    
    // When route changes, send exit for the PREVIOUS route
    if (currentRouteRef.current !== pathname) {
      sendPageExit();
      
      // Reset for the new route
      entryTimeRef.current = Date.now();
      currentRouteRef.current = pathname;
    }
  }, [pathname, sessionId]);
}
