import './EmptyState.css';

export function EmptyState({ message }: { message: string }) {
  return <div className="ui-empty-state">{message}</div>;
}
