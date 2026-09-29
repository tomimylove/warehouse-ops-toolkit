import { useEffect, useState } from 'react';

const STORAGE_KEY = 'board-background';

// Curated gradients stand in for a photo picker (YouGile lets you search
// Unsplash) until we wire a real image-search API and key — swapping the
// `value` for a photo URL later needs no change on the consuming side,
// since Task boards will just read this same preference as a CSS
// background, whatever it resolves to.
export const BOARD_BACKGROUNDS = [
  { id: 'none', label: 'None', value: 'none' },
  { id: 'ocean', label: 'Ocean', value: 'linear-gradient(135deg, #1e3a5f, #2563eb)' },
  { id: 'sunset', label: 'Sunset', value: 'linear-gradient(135deg, #f97316, #db2777)' },
  { id: 'forest', label: 'Forest', value: 'linear-gradient(135deg, #14532d, #4ade80)' },
  { id: 'slate', label: 'Slate', value: 'linear-gradient(135deg, #1f2937, #4b5563)' },
  { id: 'violet', label: 'Violet', value: 'linear-gradient(135deg, #4c1d95, #a78bfa)' },
  { id: 'sand', label: 'Sand', value: 'linear-gradient(135deg, #92400e, #fbbf24)' },
];

export function useBoardBackground() {
  const [backgroundId, setBackgroundId] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? 'none',
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, backgroundId);
  }, [backgroundId]);

  const background = BOARD_BACKGROUNDS.find((b) => b.id === backgroundId) ?? BOARD_BACKGROUNDS[0];

  return { background, backgroundId, setBackgroundId };
}
