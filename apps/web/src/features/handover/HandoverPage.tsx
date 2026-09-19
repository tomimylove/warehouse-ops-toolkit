import { EmptyState, PageHeader } from '../../components/ui';

export function HandoverPage() {
  return (
    <section className="module-page">
      <PageHeader title="Handover" subtitle="Not started yet." />
      <EmptyState message="This module hasn't been built. See specs/features/ once its spec is written." />
    </section>
  );
}
