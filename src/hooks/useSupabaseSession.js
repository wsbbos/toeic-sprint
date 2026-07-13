import { useEffect, useRef, useState } from 'react';

export function useSupabaseSession({ client, enabled, onSession, onError }) {
  const callbacksRef = useRef({ onSession, onError });
  const [status, setStatus] = useState(enabled ? 'loading' : 'disabled');

  useEffect(() => {
    callbacksRef.current = { onSession, onError };
  }, [onError, onSession]);

  useEffect(() => {
    if (!enabled || !client) {
      return undefined;
    }

    let active = true;

    client.auth.getSession()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) throw error;
        await callbacksRef.current.onSession(data?.session || null, 'INITIAL_SESSION');
        if (active) setStatus('ready');
      })
      .catch(async (error) => {
        if (!active) return;
        setStatus('error');
        await callbacksRef.current.onError(error);
      });

    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;
        try {
          await callbacksRef.current.onSession(session, event);
          if (active) setStatus('ready');
        } catch (error) {
          if (!active) return;
          setStatus('error');
          await callbacksRef.current.onError(error);
        }
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client, enabled]);

  return status;
}
