import { EmptyState, PageHeader } from '../../components/ui';

export function WeeklyMeetingPage() {
  return (
    <section className="module-page">
      <PageHeader title="Weekly Meeting" subtitle="Not started yet." />
      <EmptyState message="This module hasn't been built. See specs/features/ once its spec is written." />
    </section>
  );
}
