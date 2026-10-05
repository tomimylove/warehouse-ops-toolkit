import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Pin, Plus } from 'lucide-react';
import { Button, Input, RichTextEditor } from '../../components/ui';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { usePermissions } from '../../app/PermissionsContext';
import { announcementsApi } from './api';
import type { Announcement, Team } from './types';

interface Draft {
  title: string;
  body: string;
  pinned: boolean;
  teamIds: string[];
}

const EMPTY_DRAFT: Draft = { title: '', body: '', pinned: false, teamIds: [] };

function draftKey(announcementId: string | null) {
  return `announcement-draft:${announcementId ?? 'new'}`;
}

interface AnnouncementComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Announcement | null;
  onSaved: () => void;
}

// Accidental-close protection (click outside, Escape): the draft is
// debounce-saved to localStorage on every change and only ever cleared
// after a successful Publish/Save — closing the dialog any other way just
// hides it, the draft is still there next time it opens.
export function AnnouncementComposer({ open, onOpenChange, editing, onSaved }: AnnouncementComposerProps) {
  const { has } = usePermissions();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [limitTeams, setLimitTeams] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    announcementsApi.listTeams().then(setTeams).catch(() => {});

    const stored = localStorage.getItem(draftKey(editing?.id ?? null));
    if (stored) {
      setDraft(JSON.parse(stored));
      setLimitTeams(JSON.parse(stored).teamIds.length > 0);
      setRestoredDraft(true);
    } else if (editing) {
      setDraft({ title: editing.title, body: editing.body, pinned: editing.pinned, teamIds: editing.teams.map((t) => t.id) });
      setLimitTeams(!editing.visibleToAll);
      setRestoredDraft(false);
    } else {
      setDraft(EMPTY_DRAFT);
      setLimitTeams(false);
      setRestoredDraft(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id]);

  useEffect(() => {
    if (!open) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(draftKey(editing?.id ?? null), JSON.stringify(draft));
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [draft, open, editing?.id]);

  function clearDraft() {
    localStorage.removeItem(draftKey(editing?.id ?? null));
    setRestoredDraft(false);
  }

  function discardDraft() {
    clearDraft();
    setDraft(
      editing
        ? { title: editing.title, body: editing.body, pinned: editing.pinned, teamIds: editing.teams.map((t) => t.id) }
        : EMPTY_DRAFT,
    );
    setLimitTeams(editing ? !editing.visibleToAll : false);
  }

  function toggleTeam(teamId: string) {
    setDraft((d) => ({
      ...d,
      teamIds: d.teamIds.includes(teamId) ? d.teamIds.filter((id) => id !== teamId) : [...d.teamIds, teamId],
    }));
  }

  async function createTeam(name: string) {
    const team = await announcementsApi.createTeam(name);
    setTeams((t) => [...t, team]);
    toggleTeam(team.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.body.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: draft.title.trim(),
        body: draft.body,
        pinned: draft.pinned,
        visibleToAll: !limitTeams,
        teamIds: limitTeams ? draft.teamIds : [],
      };
      if (editing) {
        await announcementsApi.update(editing.id, payload);
      } else {
        await announcementsApi.create(payload);
      }
      clearDraft();
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const selectedTeams = teams.filter((t) => draft.teamIds.includes(t.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit announcement' : 'New announcement'}</DialogTitle>
        </DialogHeader>

        {restoredDraft && (
          <div className="bg-muted flex items-center justify-between rounded-md px-3 py-2 text-sm">
            <span className="text-muted-foreground">Restored your unsaved draft.</span>
            <Button type="button" variant="ghost" size="sm" onClick={discardDraft}>
              Discard draft
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Title"
          />
          <RichTextEditor
            value={draft.body}
            onChange={(body) => setDraft((d) => ({ ...d, body }))}
            placeholder="What's the announcement?"
          />

          <div className="flex flex-wrap items-center gap-2">
            {has('announcements:pin') && (
              <Button
                type="button"
                variant={draft.pinned ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setDraft((d) => ({ ...d, pinned: !d.pinned }))}
              >
                <Pin className="size-3.5" />
                {draft.pinned ? 'Pinned' : 'Pin'}
              </Button>
            )}

            <Button
              type="button"
              variant={limitTeams ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setLimitTeams((v) => !v)}
            >
              {limitTeams ? 'Limited to specific teams' : 'Visible to everyone'}
            </Button>

            {limitTeams && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    {selectedTeams.length > 0 ? `${selectedTeams.length} team(s)` : 'Choose teams'}
                    <ChevronDown className="size-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                  <TeamPicker teams={teams} selectedIds={draft.teamIds} onToggle={toggleTeam} onCreate={createTeam} />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {limitTeams && selectedTeams.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedTeams.map((t) => (
                <span key={t.id} className="bg-muted rounded-full px-2 py-0.5 text-xs">
                  {t.name}
                </span>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {editing ? 'Save' : 'Publish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamPicker({
  teams,
  selectedIds,
  onToggle,
  onCreate,
}: {
  teams: Team[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const [query, setQuery] = useState('');
  const exactMatch = teams.some((t) => t.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <Command>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Find or create a team…" />
      <CommandList>
        <CommandEmpty>
          {query.trim() && !exactMatch ? (
            <button
              type="button"
              className="hover:bg-accent flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm"
              onClick={() => {
                onCreate(query.trim());
                setQuery('');
              }}
            >
              <Plus className="size-3.5" />
              Create "{query.trim()}"
            </button>
          ) : (
            'No teams yet.'
          )}
        </CommandEmpty>
        <CommandGroup>
          {teams.map((team) => (
            <CommandItem key={team.id} onSelect={() => onToggle(team.id)}>
              <Check className={selectedIds.includes(team.id) ? 'opacity-100' : 'opacity-0'} />
              {team.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
