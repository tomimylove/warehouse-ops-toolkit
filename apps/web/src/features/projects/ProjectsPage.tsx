import { EmptyState, PageHeader } from '../../components/ui';

export function ProjectsPage() {
  return (
    <section className="module-page">
      <PageHeader title="Projects" subtitle="Select Boards or TA27 from the sidebar." />
      <EmptyState message="This module hasn't been built. See specs/features/ once its spec is written." />
    </section>
  );
}
