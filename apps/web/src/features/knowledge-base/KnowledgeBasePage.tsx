import { EmptyState, PageHeader } from '../../components/ui';

export function KnowledgeBasePage() {
  return (
    <section className="module-page">
      <PageHeader title="Knowledge Base" subtitle="Not started yet." />
      <EmptyState message="This module hasn't been built. See specs/features/ once its spec is written." />
    </section>
  );
}
