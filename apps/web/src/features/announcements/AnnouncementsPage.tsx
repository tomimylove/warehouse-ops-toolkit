import { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/provider';
import { Button, Card, EmptyState, Input, PageHeader, Textarea } from '../../components/ui';
import type { Announcement } from './types';
import './AnnouncementsPage.css';

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
    <section className="announcements-page">
      <PageHeader title="Announcements" subtitle="What the team needs to know, in one place." />

      <Card className="announcements-form">
        <form onSubmit={handleSubmit}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's the announcement?"
          />
          <Button type="submit">Publish</Button>
        </form>
      </Card>

      {loading && <p>Loading…</p>}
      {error && (
        <p role="alert" className="announcements-error">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState message="No announcements yet — publish the first one above." />
      )}

      <ul className="announcements-list">
        {items.map((item) => (
          <li key={item.id}>
            <Card>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
