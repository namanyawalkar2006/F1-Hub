import { useState, useEffect, useCallback, useRef } from 'react';
import { LiveState } from '../types';
import { calculateFreshness } from '../utils/f1State';

export function useLiveF1() {
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const selectedSessionKeyRef = useRef<number | null>(null);
  const snapshotRequestIdRef = useRef(0);
  const sessionSwitchIdRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // REST snapshots are scoped to the current selection so late responses cannot replace it.
  const fetchRestSnapshot = useCallback(async (key?: number | null) => {
    const activeKey = key === undefined ? selectedSessionKeyRef.current : key;
    const requestId = ++snapshotRequestIdRef.current;

    try {
      const url = activeKey ? `/api/live?session_key=${activeKey}` : '/api/live';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Timing request failed (${res.status})`);
      const data: LiveState = await res.json();

      if (requestId !== snapshotRequestIdRef.current || activeKey !== selectedSessionKeyRef.current) return;
      if (activeKey !== null && data.session.session_key !== activeKey) {
        throw new Error('The timing service returned data for a different session.');
      }

      setLiveState(data);
      setLoadError(null);
    } catch (error) {
      if (requestId !== snapshotRequestIdRef.current || activeKey !== selectedSessionKeyRef.current) return;
      console.error('[F1 Hub] Failed to fetch timing snapshot', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load timing data');
    }
  }, []);

  // Connect WebSocket
  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectStart = Date.now();

      ws.onopen = () => {
        if (unmounted) return;
        setIsConnected(true);
        setLatencyMs(Date.now() - connectStart);
      };

      ws.onmessage = (event) => {
        if (unmounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'live_snapshot' || payload.type === 'live_state_update') {
            const data = payload.data as LiveState;
            if ((data.session.session_key ?? null) === selectedSessionKeyRef.current) {
              setLiveState(data);
              setLoadError(null);
            }
          }
        } catch {
          // ignore invalid messages
        }
      };

      ws.onclose = () => {
        if (unmounted) return;
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        if (unmounted) return;
        setIsConnected(false);
      };
    }

    fetchRestSnapshot();
    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchRestSnapshot]);

  // Recalculate freshness every 1 second based on wall clock
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveState(prev => {
        if (!prev) return null;
        const fresh = calculateFreshness(prev.last_verified_timestamp);
        return {
          ...prev,
          freshness: fresh,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const switchSession = useCallback(async (sessionKey: number | null) => {
    const switchId = ++sessionSwitchIdRef.current;
    selectedSessionKeyRef.current = sessionKey;
    setSelectedSessionKey(sessionKey);
    setLiveState(null);
    setIsLoading(true);
    setLoadError(null);

    try {
      await fetchRestSnapshot(sessionKey);
    } finally {
      if (switchId === sessionSwitchIdRef.current) setIsLoading(false);
    }
  }, [fetchRestSnapshot]);

  return {
    liveState,
    isConnected,
    isLoading,
    loadError,
    selectedSessionKey,
    latencyMs,
    switchSession,
    refresh: () => fetchRestSnapshot(selectedSessionKeyRef.current),
  };
}
