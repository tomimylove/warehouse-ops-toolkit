import { Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { AnnouncementsPage } from './features/announcements/AnnouncementsPage';
import { HandoverPage } from './features/handover/HandoverPage';
import { AdminPage } from './features/admin/AdminPage';
import { DigitalTwinPage } from './features/digital-twin/DigitalTwinPage';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<AnnouncementsPage />} />
        <Route path="/handover" element={<HandoverPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/digital-twin" element={<DigitalTwinPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
