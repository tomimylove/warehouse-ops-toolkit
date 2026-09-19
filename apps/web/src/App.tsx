import { AnnouncementsPage } from './features/announcements/AnnouncementsPage';
import { DesignComparisonPage } from './features/design-comparison/DesignComparisonPage';

// No router yet (single module so far) — #compare is a temporary escape
// hatch to view the Fluent UI vs custom design system comparison.
// Remove this branch once that decision is made.
function App() {
  const isComparison = window.location.hash === '#compare';

  return <main>{isComparison ? <DesignComparisonPage /> : <AnnouncementsPage />}</main>;
}

export default App;
