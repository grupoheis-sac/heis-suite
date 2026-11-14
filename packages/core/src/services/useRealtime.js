import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../auth/authStore';

export function useRealtime(onEventCallback = null) {
  const { isAuthenticated, empresa } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const callbackRef = useRef(onEventCallback);

  useEffect(() => {
    callbackRef.current = onEventCallback;
  }, [onEventCallback]);

  useEffect(() => {
    if (!isAuthenticated) {
      setConnected(false);
      return;
    }

    const token = localStorage.getItem('heis_token');
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const empresaParam = empresa?.id ? `&empresa_id=${empresa.id}` : '';
    const streamUrl = `${baseUrl}/core/realtime/stream?token=${encodeURIComponent(token)}${empresaParam}`;

    let es = null;
    let reconnectTimer = null;

    const connect = () => {
      try {
        es = new EventSource(streamUrl);

        es.onopen = () => {
          setConnected(true);
        };

        es.onmessage = (evt) => {
          try {
            const parsed = JSON.parse(evt.data);
            if (parsed?.event && parsed.event !== 'connected') {
              window.dispatchEvent(
                new CustomEvent(`heis:rt:${parsed.event}`, { detail: parsed.data })
              );
              if (typeof callbackRef.current === 'function') {
                callbackRef.current(parsed.event, parsed.data, parsed);
              } else if (callbackRef.current && typeof callbackRef.current === 'object') {
                const handler = callbackRef.current[parsed.event];
                if (typeof handler === 'function') {
                  handler(parsed.data, parsed);
                }
              }
            }
          } catch (_) {}
        };

        es.onerror = () => {
          setConnected(false);
          if (es) es.close();
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch (_) {
        setConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) es.close();
    };
  }, [isAuthenticated, empresa?.id]);

  return { connected };
}

export default useRealtime;
