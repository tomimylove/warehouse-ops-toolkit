import { useState } from 'react';
import './Table.css';

export interface Column<T> {
  key: keyof T;
  header: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
}

// Minimal table: click a header to sort by it, ascending/descending toggle.
// No column resize, no row selection, no virtualization for large row counts.
export function Table<T extends Record<string, unknown>>({ columns, rows, getRowId }: TableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedRows = sortKey
    ? [...rows].sort((a, b) => {
        const av = String(a[sortKey]);
        const bv = String(b[sortKey]);
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : rows;

  return (
    <table className="ui-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)} onClick={() => toggleSort(col.key)}>
              {col.header}
              {sortKey === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <tr key={getRowId(row)}>
            {columns.map((col) => (
              <td key={String(col.key)}>{String(row[col.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
