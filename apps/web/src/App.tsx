import { useEffect, useState } from 'react';
import { AnnouncementsPage } from './features/announcements/AnnouncementsPage';
import { DesignComparisonPage } from './features/design-comparison/DesignComparisonPage';

// No router yet (single module so far) — #compare is a temporary escape
// hatch to view the Fluent UI vs custom design system comparison.
// Remove this branch once that decision is made.
function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const isComparison = hash === '#compare';

  return <main>{isComparison ? <DesignComparisonPage /> : <AnnouncementsPage />}</main>;
}

export default App;
