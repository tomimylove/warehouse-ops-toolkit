import { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Combobox as FluentCombobox,
  Option as FluentOption,
  DataGrid as FluentDataGrid,
  DataGridHeader as FluentDataGridHeader,
  DataGridHeaderCell as FluentDataGridHeaderCell,
  DataGridBody as FluentDataGridBody,
  DataGridRow as FluentDataGridRow,
  DataGridCell as FluentDataGridCell,
  createTableColumn,
  Dialog as FluentDialog,
  DialogSurface as FluentDialogSurface,
  DialogTitle as FluentDialogTitle,
  DialogBody as FluentDialogBody,
  DialogActions as FluentDialogActions,
  DialogTrigger as FluentDialogTrigger,
  Button as FluentButton,
} from '@fluentui/react-components';
import { Button, Card, Combobox, Dialog, PageHeader, Table } from '../../components/ui';
import './DesignComparisonPage.css';

const zones = [
  { value: 'a', label: 'Zone A — Receiving' },
  { value: 'b', label: 'Zone B — Bulk Storage' },
  { value: 'c', label: 'Zone C — Pick Face' },
  { value: 'd', label: 'Zone D — Staging' },
];

const rackRows = [
  { id: '1', code: 'R-A-01', bays: 12, levels: 4, occupancy: '78%' },
  { id: '2', code: 'R-A-02', bays: 10, levels: 4, occupancy: '54%' },
  { id: '3', code: 'R-B-01', bays: 8, levels: 3, occupancy: '91%' },
];

const columns = [
  { key: 'code' as const, header: 'Rack' },
  { key: 'bays' as const, header: 'Bays' },
  { key: 'levels' as const, header: 'Levels' },
  { key: 'occupancy' as const, header: 'Occupancy' },
];

const fluentColumns = [
  createTableColumn<(typeof rackRows)[number]>({
    columnId: 'code',
    renderHeaderCell: () => 'Rack',
    renderCell: (item) => item.code,
  }),
  createTableColumn<(typeof rackRows)[number]>({
    columnId: 'bays',
    renderHeaderCell: () => 'Bays',
    renderCell: (item) => item.bays,
  }),
  createTableColumn<(typeof rackRows)[number]>({
    columnId: 'levels',
    renderHeaderCell: () => 'Levels',
    renderCell: (item) => item.levels,
  }),
  createTableColumn<(typeof rackRows)[number]>({
    columnId: 'occupancy',
    renderHeaderCell: () => 'Occupancy',
    renderCell: (item) => item.occupancy,
  }),
];

export function DesignComparisonPage() {
  const [customZone, setCustomZone] = useState<string | null>(null);
  const [fluentZone, setFluentZone] = useState<string | undefined>(undefined);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [dark, setDark] = useState(false);

  return (
    <div className="comparison-page">
      <PageHeader
        title="Design system comparison"
        subtitle="Temporary decision page — not part of the product. Delete once the call is made."
      />

      <Button variant="secondary" onClick={() => setDark((d) => !d)}>
        Toggle dark preview: {dark ? 'on' : 'off'}
      </Button>

      <div className="comparison-grid">
        <Card>
          <h2>Combobox — ours (hand-built)</h2>
          <Combobox options={zones} value={customZone} onChange={setCustomZone} placeholder="Pick a zone" />
          <p className="comparison-note">
            No arrow-key navigation, no ARIA combobox pattern, no virtualization. ~70 lines we wrote and now own.
          </p>
        </Card>

        <FluentProvider theme={dark ? webDarkTheme : webLightTheme}>
          <Card>
            <h2>Combobox — Fluent UI</h2>
            <FluentCombobox
              placeholder="Pick a zone"
              value={zones.find((z) => z.value === fluentZone)?.label ?? ''}
              onOptionSelect={(_, data) => setFluentZone(data.optionValue)}
            >
              {zones.map((z) => (
                <FluentOption key={z.value} value={z.value}>
                  {z.label}
                </FluentOption>
              ))}
            </FluentCombobox>
            <p className="comparison-note">
              Keyboard nav, ARIA pattern, and typeahead included — zero lines of that logic written by us.
            </p>
          </Card>
        </FluentProvider>

        <Card>
          <h2>Table — ours (hand-built)</h2>
          <Table columns={columns} rows={rackRows} getRowId={(r) => r.id} />
          <p className="comparison-note">
            Click a header to sort. No column resize, no row selection, no virtualization for large lists.
          </p>
        </Card>

        <FluentProvider theme={dark ? webDarkTheme : webLightTheme}>
          <Card>
            <h2>Table — Fluent UI DataGrid</h2>
            <FluentDataGrid items={rackRows} columns={fluentColumns} getRowId={(item) => item.id} sortable>
              <FluentDataGridHeader>
                <FluentDataGridRow>
                  {({ renderHeaderCell }) => (
                    <FluentDataGridHeaderCell>{renderHeaderCell()}</FluentDataGridHeaderCell>
                  )}
                </FluentDataGridRow>
              </FluentDataGridHeader>
              <FluentDataGridBody<(typeof rackRows)[number]>>
                {({ item, rowId }) => (
                  <FluentDataGridRow key={rowId}>
                    {({ renderCell }) => <FluentDataGridCell>{renderCell(item)}</FluentDataGridCell>}
                  </FluentDataGridRow>
                )}
              </FluentDataGridBody>
            </FluentDataGrid>
            <p className="comparison-note">
              Built-in sort affordance, keyboard grid navigation, consistent focus states.
            </p>
          </Card>
        </FluentProvider>

        <Card>
          <h2>Dialog — ours (hand-built)</h2>
          <Button onClick={() => setCustomDialogOpen(true)}>Open dialog</Button>
          <Dialog open={customDialogOpen} title="Delete rack?" onClose={() => setCustomDialogOpen(false)}>
            <p>This can&apos;t be undone.</p>
            <Button variant="danger" onClick={() => setCustomDialogOpen(false)}>
              Delete
            </Button>
          </Dialog>
          <p className="comparison-note">
            No focus trap, no Escape-to-close, no scroll lock, no portal. All would need to be added by hand.
          </p>
        </Card>

        <FluentProvider theme={dark ? webDarkTheme : webLightTheme}>
          <Card>
            <h2>Dialog — Fluent UI</h2>
            <FluentDialog>
              <FluentDialogTrigger disableButtonEnhancement>
                <FluentButton>Open dialog</FluentButton>
              </FluentDialogTrigger>
              <FluentDialogSurface>
                <FluentDialogBody>
                  <FluentDialogTitle>Delete rack?</FluentDialogTitle>
                  <p>This can&apos;t be undone.</p>
                  <FluentDialogActions>
                    <FluentButton appearance="primary">Delete</FluentButton>
                  </FluentDialogActions>
                </FluentDialogBody>
              </FluentDialogSurface>
            </FluentDialog>
            <p className="comparison-note">
              Focus trap, Escape-to-close, scroll lock, and portal rendering included out of the box.
            </p>
          </Card>
        </FluentProvider>
      </div>
    </div>
  );
}
