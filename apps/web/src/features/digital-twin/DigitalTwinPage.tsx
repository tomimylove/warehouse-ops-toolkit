import { EmptyState, PageHeader } from '../../components/ui';

export function DigitalTwinPage() {
  return (
    <section className="module-page">
      <PageHeader title="Digital Twin" subtitle="Not started yet — Photo Plan and Isometric Schema views." />
      <EmptyState message="This module hasn't been built. See specs/ARCHITECTURE.md, Digital Twin section." />
    </section>
  );
}
