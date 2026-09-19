// Custom icon paths ported from the original app's Feather-style icon
// set (src/app.js `icon()` helper + per-module ICON_* constants) —
// used wherever we know the exact original path, instead of a
// visually-similar but different Lucide icon.
interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function makeIcon(d: string) {
  return function PathIcon({ size = 17, strokeWidth = 2, className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d={d} />
      </svg>
    );
  };
}

export const BellIcon = makeIcon(
  'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
);
export const SwapIcon = makeIcon(
  'M17 1l4 4-4 4 M3 11V9a4 4 0 014-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 01-4 4H3',
);
export const CubeIcon = makeIcon('M3 9l9-6 9 6-9 6-9-6z M3 9v9l9 6 9-6V9 M12 15V9');
export const ShieldIcon = makeIcon('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');
export const ChevronRightIcon = makeIcon('M9 6l6 6-6 6');
