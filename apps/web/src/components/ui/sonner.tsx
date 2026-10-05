import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from '@/app/ThemeContext';

export function Toaster(props: ToasterProps) {
  const { mode } = useTheme();

  return (
    <Sonner
      theme={mode}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
