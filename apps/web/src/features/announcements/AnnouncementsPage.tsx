import { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/provider';
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
    <section>
      <h1>Announcements</h1>

      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's the announcement?"
        />
        <button type="submit">Publish</button>
      </form>

      {loading && <p>Loading…</p>}
      {error && <p role="alert">{error}</p>}

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
