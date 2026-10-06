import { Route, Routes } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { RequirePermission } from './app/RequirePermission';
import { AnnouncementsPage } from './features/announcements/AnnouncementsPage';
import { HsePage } from './features/hse/HsePage';
import { StaffPage } from './features/warehouse/StaffPage';
import { WeeklyMeetingPage } from './features/warehouse/WeeklyMeetingPage';
import { DigitalTwinPage } from './features/digital-twin/DigitalTwinPage';
import { DashboardsPage } from './features/dashboards/DashboardsPage';
import { LinksPage } from './features/links/LinksPage';
import { TasksPage } from './features/tasks/TasksPage';
import { KnowledgeBasePage } from './features/knowledge-base/KnowledgeBasePage';
import { ProfilePage } from './features/profile/ProfilePage';
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
          path="/operations/hse"
          element={
            <RequirePermission permission="operations:view">
              <HsePage />
            </RequirePermission>
          }
        />
        <Route
          path="/operations/staff"
          element={
            <RequirePermission permission="operations:view">
              <StaffPage />
            </RequirePermission>
          }
        />
        <Route
          path="/operations/weekly-meeting"
          element={
            <RequirePermission permission="operations:view">
              <WeeklyMeetingPage />
            </RequirePermission>
          }
        />
        <Route
          path="/operations/digital-twin"
          element={
            <RequirePermission permission="operations:view">
              <DigitalTwinPage />
            </RequirePermission>
          }
        />
        <Route
          path="/operations/dashboards"
          element={
            <RequirePermission permission="operations:view">
              <DashboardsPage />
            </RequirePermission>
          }
        />
        <Route
          path="/operations/links"
          element={
            <RequirePermission permission="operations:view">
              <LinksPage />
            </RequirePermission>
          }
        />
        <Route
          path="/tasks"
          element={
            <RequirePermission permission="tasks:view">
              <TasksPage />
            </RequirePermission>
          }
        />
        <Route
          path="/tasks/:projectId"
          element={
            <RequirePermission permission="tasks:view">
              <TasksPage />
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
          path="/profile"
          element={
            <RequirePermission permission="profile:view">
              <ProfilePage />
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
