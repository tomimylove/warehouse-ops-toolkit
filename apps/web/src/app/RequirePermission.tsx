import type { ReactNode } from 'react';
import { PageHeader, EmptyState } from '@/components/ui';
import { usePermissions } from './PermissionsContext';

// Blocks a route the same way a missing sidebar entry does — going
// straight to the URL doesn't get further than the nav did. Renders
// nothing informative about what the page would have shown.
export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { has, loading } = usePermissions();

  if (loading) return null;
  if (!has(permission)) {
    return (
      <section className="mx-auto max-w-2xl">
        <PageHeader title="Access restricted" />
        <EmptyState message="You don't have permission to view this page." />
      </section>
    );
  }

  return children;
}
