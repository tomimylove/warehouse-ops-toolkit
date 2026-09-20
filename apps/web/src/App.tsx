import { Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { RequirePermission } from './app/RequirePermission';
import { AnnouncementsPage } from './features/announcements/AnnouncementsPage';
import { HsePage } from './features/hse/HsePage';
import { StaffPage } from './features/warehouse/StaffPage';
import { WeeklyMeetingPage } from './features/warehouse/WeeklyMeetingPage';
import { DigitalTwinPage } from './features/digital-twin/DigitalTwinPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
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
        <Route
          path="/"
          element={
            <RequirePermission permission="announcements:view">
              <AnnouncementsPage />
            </RequirePermission>
          }
        />
        <Route
          path="/hse"
          element={
            <RequirePermission permission="hse:view">
              <HsePage />
            </RequirePermission>
          }
        />
        <Route
          path="/warehouse/staff"
          element={
            <RequirePermission permission="warehouse:view">
              <StaffPage />
            </RequirePermission>
          }
        />
        <Route
          path="/warehouse/weekly-meeting"
          element={
            <RequirePermission permission="warehouse:view">
              <WeeklyMeetingPage />
            </RequirePermission>
          }
        />
        <Route
          path="/warehouse/digital-twin"
          element={
            <RequirePermission permission="warehouse:view">
              <DigitalTwinPage />
            </RequirePermission>
          }
        />
        <Route
          path="/projects"
          element={
            <RequirePermission permission="projects:view">
              <ProjectsPage />
            </RequirePermission>
          }
        />
        <Route
          path="/planner"
          element={
            <RequirePermission permission="planner:view">
              <PlannerPage />
            </RequirePermission>
          }
        />
        <Route
          path="/dashboards"
          element={
            <RequirePermission permission="dashboards:view">
              <DashboardsPage />
            </RequirePermission>
          }
        />
        <Route
          path="/knowledge-base"
          element={
            <RequirePermission permission="knowledge-base:view">
              <KnowledgeBasePage />
            </RequirePermission>
          }
        />
        <Route
          path="/handover"
          element={
            <RequirePermission permission="handover:view">
              <HandoverPage />
            </RequirePermission>
          }
        />
        <Route
          path="/links"
          element={
            <RequirePermission permission="links:view">
              <LinksPage />
            </RequirePermission>
          }
        />
        <Route
          path="/admin"
          element={
            <RequirePermission permission="admin:view">
              <AdminPage />
            </RequirePermission>
          }
        />
      </Routes>
    </AppShell>
  );
}

export default App;
