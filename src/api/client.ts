import { getApiUrl } from '@/api/config';
import type { ErrorResponse } from '@/api/types';

/** Error thrown for every non-2xx response. */
export class ApiError extends Error {
  readonly status: number;
  readonly type: string | undefined;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    message: string,
    status: number,
    type?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
    this.details = details;
  }
}

export type ApiRequest = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Encoded as JSON with Content-Type: application/json. */
  json?: unknown;
  /** Sent as the body as is, for file uploads. Needs contentType. Takes no part in JSON encoding. */
  rawBody?: Blob;
  contentType?: string;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

let authToken: string | null = null;
const unauthorizedCallbacks = new Set<() => void>();

/** Sets the bearer token sent with every request. Pass null to clear it. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Returns the current bearer token, for upload helpers that do not use apiFetch. */
export function getAuthToken(): string | null {
  return authToken;
}

/** Registers a callback for a 401 on a request that sent a token. Returns an unsubscribe function. */
export function onUnauthorized(callback: () => void): () => void {
  unauthorizedCallbacks.add(callback);
  return () => {
    unauthorizedCallbacks.delete(callback);
  };
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return typeof value === 'object' && value !== null && typeof (value as ErrorResponse).error === 'string';
}

/** The error for any request that never got an answer. */
export function networkError(): ApiError {
  return new ApiError("Can't reach the server. Check your connection.", 0);
}

/** Builds an ApiError from a status and a response body string. */
export function toApiError(status: number, bodyText: string): ApiError {
  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = undefined;
  }
  if (isErrorResponse(body)) return new ApiError(body.error, status, body.type, body.details);
  return new ApiError(`Request failed with status ${status}`, status);
}

/** Calls the onUnauthorized callbacks. */
export function notifyUnauthorized(): void {
  unauthorizedCallbacks.forEach((callback) => callback());
}

/** Calls the API. Resolves to undefined for 204 responses. */
export async function apiFetch<T>(path: string, request: ApiRequest = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(request.query ?? {})) {
    if (value !== undefined) params.append(key, String(value));
  }
  const queryString = params.toString();
  const url = getApiUrl() + path + (queryString ? `?${queryString}` : '');

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (request.rawBody) {
    if (request.contentType) headers['Content-Type'] = request.contentType;
  } else if (request.json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: request.method ?? 'GET',
      headers,
      body: request.rawBody ?? (request.json !== undefined ? JSON.stringify(request.json) : undefined),
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw networkError();
  }

  if (!response.ok) {
    // Only a rejected token means the session ended; a failed login is a plain 401.
    if (response.status === 401 && headers.Authorization) notifyUnauthorized();
    throw toApiError(response.status, await response.text());
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
