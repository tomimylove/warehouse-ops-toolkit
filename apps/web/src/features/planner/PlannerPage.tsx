import { EmptyState, PageHeader } from '../../components/ui';

export function PlannerPage() {
  return (
    <section className="module-page">
      <PageHeader title="Planner" subtitle="Not started yet." />
      <EmptyState message="This module hasn't been built. See specs/features/ once its spec is written." />
    </section>
  );
}
