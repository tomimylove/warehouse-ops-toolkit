import { EmptyState, PageHeader } from '../../components/ui';

export function TasksPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <PageHeader
        title="Tasks"
        subtitle="Not started yet — replaces the old Projects/Planner split. Project → Board (tabs) → Column → Task, with Board/Gantt/Calendar as views."
      />
      <EmptyState message="This module hasn't been built. See specs/ARCHITECTURE.md, раздел 12." />
    </section>
  );
}
