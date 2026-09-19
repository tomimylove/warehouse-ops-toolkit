import { EmptyState, PageHeader } from '../../components/ui';

export function WarehousePage() {
  return (
    <section className="module-page">
      <PageHeader title="Warehouse" subtitle="Select Staff, Weekly meeting or Digital twin from the sidebar." />
      <EmptyState message="This module hasn't been built. See specs/features/ once its spec is written." />
    </section>
  );
}
