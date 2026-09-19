import { EmptyState, PageHeader } from '../../components/ui';

export function LinksPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <PageHeader title="Links" subtitle="Not started yet." />
      <EmptyState message="This module hasn't been built. See specs/features/ once its spec is written." />
    </section>
  );
}
