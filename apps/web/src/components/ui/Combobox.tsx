import { useMemo, useRef, useState } from 'react';
import './Combobox.css';

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Minimal searchable select, built by hand: no keyboard-arrow navigation,
// no virtualization for long lists, no accessible combobox ARIA pattern
// (role/aria-activedescendant wiring) — that's the real cost of "just build
// it ourselves" this component is meant to make visible.
export function Combobox({ options, value, onChange, placeholder }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  return (
    <div className="ui-combobox" ref={rootRef}>
      <input
        className="ui-input"
        value={open ? query : selectedLabel}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
      />
      {open && (
        <ul className="ui-combobox__list">
          {filtered.length === 0 && <li className="ui-combobox__empty">No matches</li>}
          {filtered.map((option) => (
            <li
              key={option.value}
              onMouseDown={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
