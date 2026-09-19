import { EmptyState, PageHeader } from '../../components/ui';

export function Ta27Page() {
  return (
    <section className="module-page">
      <PageHeader title="TA27" subtitle="Not started yet." />
      <EmptyState message="This module hasn't been built. See specs/features/ once its spec is written." />
    </section>
  );
}
