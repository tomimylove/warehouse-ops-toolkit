import { EmptyState, PageHeader } from '../../components/ui';

export function ProfilePage() {
  return (
    <section className="mx-auto max-w-2xl">
      <PageHeader
        title="Profile"
        subtitle="Not started yet — personal work hub: my tasks, Handover, my activity. See specs/ARCHITECTURE.md, раздел 12."
      />
      <EmptyState message="This module hasn't been built." />
    </section>
  );
}
