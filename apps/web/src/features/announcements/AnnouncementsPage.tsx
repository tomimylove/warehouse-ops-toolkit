import { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/provider';
import { Button, Card, CardContent, EmptyState, Input, PageHeader, RichTextEditor } from '../../components/ui';
import type { Announcement } from './types';

export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await dataProvider.list<Announcement>('announcements'));
    } catch {
      setError('Could not load announcements. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await dataProvider.create<Announcement>('announcements', { title, body });
    setTitle('');
    setBody('');
    load();
  }

  return (
    <section className="mx-auto max-w-2xl">
      <PageHeader title="Announcements" subtitle="What the team needs to know, in one place." />

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <RichTextEditor value={body} onChange={setBody} placeholder="What's the announcement?" />
            <Button type="submit">Publish</Button>
          </form>
        </CardContent>
      </Card>

      {loading && <p className="text-muted-foreground mt-4 text-sm">Loading…</p>}
      {error && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="mt-4">
          <EmptyState message="No announcements yet — publish the first one above." />
        </div>
      )}

      <ul className="mt-5 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card>
              <CardContent>
                <h2 className="mb-2 text-base font-medium">{item.title}</h2>
                {/* Tiptap output is our own sanitized rich text — safe to render.
                    If this ever accepts arbitrary user HTML from elsewhere, sanitize first. */}
                <div
                  className="text-muted-foreground text-sm [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: item.body }}
                />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
