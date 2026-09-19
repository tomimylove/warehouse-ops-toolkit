import { Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { AnnouncementsPage } from './features/announcements/AnnouncementsPage';
import { InboxPage } from './features/inbox/InboxPage';
import { HsePage } from './features/hse/HsePage';
import { WarehousePage } from './features/warehouse/WarehousePage';
import { StaffPage } from './features/warehouse/StaffPage';
import { WeeklyMeetingPage } from './features/warehouse/WeeklyMeetingPage';
import { DigitalTwinPage } from './features/digital-twin/DigitalTwinPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { BoardsPage } from './features/projects/BoardsPage';
import { Ta27Page } from './features/projects/Ta27Page';
import { PlannerPage } from './features/planner/PlannerPage';
import { DashboardsPage } from './features/dashboards/DashboardsPage';
import { KnowledgeBasePage } from './features/knowledge-base/KnowledgeBasePage';
import { HandoverPage } from './features/handover/HandoverPage';
import { LinksPage } from './features/links/LinksPage';
import { AdminPage } from './features/admin/AdminPage';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<AnnouncementsPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/hse" element={<HsePage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/warehouse/staff" element={<StaffPage />} />
        <Route path="/warehouse/weekly-meeting" element={<WeeklyMeetingPage />} />
        <Route path="/warehouse/digital-twin" element={<DigitalTwinPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/boards" element={<BoardsPage />} />
        <Route path="/projects/ta27" element={<Ta27Page />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/dashboards" element={<DashboardsPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="/handover" element={<HandoverPage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
