/**
 * Session lifecycle for the whole app.
 *
 * The token lives in two places: persistent storage (survives restarts) and the
 * API client (sent with every request). This provider keeps both in sync and
 * exposes one state machine the root layout routes on:
 *
 *   loading ──► signedOut ◄──► signedIn
 *      └──────► error (network failure while restoring; retry() goes back to loading)
 *
 * Any 401 from any request signs the user out locally.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { createAccount } from '@/api/accounts';
import { ApiError, onUnauthorized, setAuthToken } from '@/api/client';
import { getMe } from '@/api/me';
import { queryKeys } from '@/api/query-keys';
import { createSession, deleteCurrentSession } from '@/api/sessions';
import type { Me } from '@/api/types';
import { clearToken, loadToken, saveToken } from '@/auth/token-storage';

type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; me: Me }
  | { status: 'error'; error: ApiError };

type SignUpInput = { username: string; email: string; password: string };

type SessionContextValue = {
  state: SessionState;
  signIn: (login: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  /** Ends the session on this device only, for when the server already deleted it (account deletion). */
  endSession: () => Promise<void>;
  /** Retries restoring the session after a startup network error. */
  retry: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(error instanceof Error ? error.message : 'Something went wrong.', 0);
}

/** Provides the session to the app. Must be inside QueryClientProvider. */
export function SessionProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  const clearLocalSession = useCallback(async () => {
    await clearToken();
    setAuthToken(null);
    queryClient.clear();
    setState({ status: 'signedOut' });
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;

    async function restore(): Promise<void> {
      const token = await loadToken();
      if (!token) {
        if (!cancelled) setState({ status: 'signedOut' });
        return;
      }
      setAuthToken(token);
      try {
        const me = await getMe();
        if (cancelled) return;
        queryClient.setQueryData(queryKeys.me, me);
        setState({ status: 'signedIn', me });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          await clearLocalSession();
          return;
        }
        setState({ status: 'error', error: toApiError(error) });
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, [restoreAttempt, queryClient, clearLocalSession]);

  useEffect(() => onUnauthorized(() => void clearLocalSession()), [clearLocalSession]);

  const signIn = useCallback(
    async (login: string, password: string) => {
      const session = await createSession({ login, password });
      await saveToken(session.token);
      setAuthToken(session.token);
      queryClient.setQueryData(queryKeys.me, session.me);
      setState({ status: 'signedIn', me: session.me });
    },
    [queryClient],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      await createAccount(input);
      await signIn(input.username, input.password);
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    try {
      await deleteCurrentSession();
    } catch {
      // The local session ends either way; a dead server must not trap the user.
    }
    await clearLocalSession();
  }, [clearLocalSession]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRestoreAttempt((attempt) => attempt + 1);
  }, []);

  const value = useMemo(
    () => ({ state, signIn, signUp, signOut, endSession: clearLocalSession, retry }),
    [state, signIn, signUp, signOut, clearLocalSession, retry],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

/** Reads the session. Throws if used outside SessionProvider. */
export function useSession(): SessionContextValue {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

/** Returns the signed-in user. Throws if called while signed out. Use only inside the (app) group. */
export function useMe(): Me {
  const { state } = useSession();
  const { data } = useQuery({ queryKey: queryKeys.me, queryFn: getMe });
  if (data) return data;
  if (state.status !== 'signedIn') throw new Error('useMe called while signed out');
  return state.me;
}
