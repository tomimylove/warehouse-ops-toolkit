import { EmptyState, PageHeader } from '../../components/ui';

export function DashboardsPage() {
  return (
    <section className="module-page">
      <PageHeader title="Dashboards" subtitle="Not started yet." />
      <EmptyState message="This module hasn't been built. See specs/features/ once its spec is written." />
    </section>
  );
}
