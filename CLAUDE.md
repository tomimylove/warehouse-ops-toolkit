# Working rules

- If a request is ambiguous, or implementing it as literally stated would
  require inventing behavior the user didn't specify, ask before building
  — don't silently decide and ship something else. Scope cuts, "I'll
  defer X", and reinterpretations of what was asked are exactly the kind
  of thing to flag and confirm first, not note after the fact in a commit
  message.
- Reuse existing components instead of building a second, thinner version
  of something that already exists — if a pattern (e.g. a chat UI) is
  already built somewhere in the app, share that component/logic rather
  than duplicating a cut-down copy of it elsewhere.

# UI conventions

- Every icon-only action button (no visible text label) must have a
  `Tooltip`/`TooltipContent` (from `@/components/ui/tooltip`) with a short
  label, even for disabled "coming soon" buttons. A button with a text
  label next to it doesn't need one.
