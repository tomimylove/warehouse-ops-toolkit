// Curated cover gallery — CSS gradients, not photos. Picking a real stock
// catalog (Unsplash/Pexels/Microsoft 365 images) needs an API key and an
// account to wire up; this is the placeholder until that's decided. Each
// entry is referenced by `id` only (Announcement.coverId), never a URL.
export interface Cover {
  id: string;
  gradient: string;
}

export const COVERS: Cover[] = [
  { id: 'sunset', gradient: 'linear-gradient(135deg, #f97316, #db2777)' },
  { id: 'ocean', gradient: 'linear-gradient(135deg, #0ea5e9, #1e3a8a)' },
  { id: 'forest', gradient: 'linear-gradient(135deg, #22c55e, #14532d)' },
  { id: 'dusk', gradient: 'linear-gradient(135deg, #8b5cf6, #1e1b4b)' },
  { id: 'citrus', gradient: 'linear-gradient(135deg, #facc15, #ea580c)' },
  { id: 'slate', gradient: 'linear-gradient(135deg, #64748b, #0f172a)' },
  { id: 'rose', gradient: 'linear-gradient(135deg, #fb7185, #9f1239)' },
  { id: 'mint', gradient: 'linear-gradient(135deg, #2dd4bf, #115e59)' },
];

// No cover chosen: derive a stable pick from the announcement id so the
// same post always shows the same cover without storing anything for it.
export function coverFor(id: string, coverId?: string | null): Cover {
  if (coverId) {
    const found = COVERS.find((c) => c.id === coverId);
    if (found) return found;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return COVERS[hash % COVERS.length];
}
