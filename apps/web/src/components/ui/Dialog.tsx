import type { ReactNode } from 'react';
import './Dialog.css';

interface DialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

// Minimal modal: no focus trap, no return-focus-on-close, no Escape-key
// handling, no portal (renders in place in the DOM tree) — the
// accessibility work a real dialog primitive normally does for you.
export function Dialog({ open, title, children, onClose }: DialogProps) {
  if (!open) return null;
  return (
    <div className="ui-dialog-backdrop" onClick={onClose}>
      <div className="ui-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ui-dialog__header">
          <h2>{title}</h2>
          <button className="ui-dialog__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="ui-dialog__body">{children}</div>
      </div>
    </div>
  );
}
