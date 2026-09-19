import type { HTMLAttributes } from 'react';
import './Badge.css';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}

// Status pill — used for things like rack-cell occupancy later, not just decoration.
export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  const toneClass = tone === 'neutral' ? '' : `ui-badge--${tone}`;
  return <span className={`ui-badge ${toneClass} ${className ?? ''}`} {...rest} />;
}
