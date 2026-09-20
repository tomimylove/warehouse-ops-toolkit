import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/rest-api-provider';

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

interface PermissionsState {
  user: CurrentUser | null;
  loading: boolean;
  /** True once /me has answered and the key is missing — never true while
   *  still loading, so gated UI doesn't flash "denied" before it knows. */
  has: (key: string) => boolean;
}

const PermissionsContext = createContext<PermissionsState | null>(null);

// Single fetch of the current user + their permission keys, shared by the
// sidebar (which items to show) and every RequirePermission route (whether
// to render the page at all). Swapping in real Azure AD later only changes
// what GET /me returns server-side — nothing here.
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/me`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const has = (key: string) => user?.permissions.includes(key) ?? false;

  return (
    <PermissionsContext.Provider value={{ user, loading, has }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}
