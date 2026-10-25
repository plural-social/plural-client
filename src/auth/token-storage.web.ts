// SecureStore has no web support, so web keeps the token in localStorage.
// Private browsing can block storage; failures degrade to "not signed in".
const KEY = 'plural.sessionToken';

export async function loadToken(): Promise<string | null> {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    // Storage unavailable: the session lasts until the tab closes.
  }
}

export async function clearToken(): Promise<void> {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}
