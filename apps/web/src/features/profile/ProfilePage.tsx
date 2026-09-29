import { Check, Moon, Sun } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme } from '../../app/useTheme';
import { useBoardBackground, BOARD_BACKGROUNDS } from '../../app/useBoardBackground';
import { usePermissions } from '../../app/PermissionsContext';

export function ProfilePage() {
  const { user } = usePermissions();
  const { theme, setTheme } = useTheme();
  const { backgroundId, setBackgroundId } = useBoardBackground();

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profile" subtitle={user?.email} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {(
            [
              { value: 'light', label: 'Light', Icon: Sun },
              { value: 'dark', label: 'Dark', Icon: Moon },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                theme === value ? 'border-primary' : 'border-border hover:border-muted-foreground',
              )}
            >
              <Icon className="size-5" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Board background</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {BOARD_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => setBackgroundId(bg.id)}
                aria-label={bg.label}
                className={cn(
                  'relative flex aspect-video items-center justify-center rounded-md border-2 text-xs font-medium text-white',
                  backgroundId === bg.id ? 'border-primary' : 'border-transparent',
                )}
                style={{ background: bg.value === 'none' ? undefined : bg.value }}
              >
                {bg.value === 'none' && <span className="text-muted-foreground">None</span>}
                {backgroundId === bg.id && (
                  <Check className="absolute top-1 right-1 size-3.5 drop-shadow" />
                )}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Applies to Task boards once that module exists. Photo search (not just presets) needs an
            image-search API key — swapped in later without changing this screen.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          My tasks, Handover, and activity land here once the Tasks module exists (specs/ARCHITECTURE.md,
          раздел 12).
        </CardContent>
      </Card>
    </section>
  );
}
