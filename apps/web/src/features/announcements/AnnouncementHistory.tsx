import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../components/ui';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { usePermissions } from '../../app/PermissionsContext';
import { announcementsApi } from './api';
import type { AnnouncementVersion } from './types';

interface AnnouncementHistoryProps {
  announcementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored: () => void;
}

export function AnnouncementHistory({ announcementId, open, onOpenChange, onRestored }: AnnouncementHistoryProps) {
  const { has } = usePermissions();
  const [versions, setVersions] = useState<AnnouncementVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    announcementsApi
      .listVersions(announcementId)
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [open, announcementId]);

  async function restore(versionId: string) {
    await announcementsApi.restoreVersion(announcementId, versionId);
    onOpenChange(false);
    onRestored();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="size-4" />
            History
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
          {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!loading && versions.length === 0 && (
            <p className="text-muted-foreground text-sm">No previous versions yet — edits will show up here.</p>
          )}
          {versions.map((v) => (
            <div key={v.id} className="border-border rounded-md border p-3 text-sm">
              <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                <span>
                  {v.savedBy.name} · {formatDistanceToNow(new Date(v.savedAt), { addSuffix: true })}
                </span>
                {!v.activity && has('announcements:edit') && (
                  <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => restore(v.id)}>
                    Restore
                  </Button>
                )}
              </div>
              {v.message && <p className="mt-1">{v.message}</p>}
              {v.changes.length > 0 && (
                <ul className="text-muted-foreground mt-1 list-inside list-disc">
                  {v.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              )}
              {v.snapshot && <p className="mt-2 font-medium">{v.snapshot.title}</p>}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
