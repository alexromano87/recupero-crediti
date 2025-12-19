import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DashboardCondivisaPage } from './pages/DashboardCondivisaPage';
import { ClientiPage } from './pages/ClientiPage';
import { RicercaPage } from './pages/RicercaPage';
import { DebitoriPage } from './pages/DebitoriPage';
import { PratichePage } from './pages/PratichePage';
import { PraticaDetailPage } from './pages/PraticaDetailPage';
import { AvvocatiPage } from './pages/AvvocatiPage';
import { AlertsPage } from './pages/AlertsPage';
import { TicketsPage } from './pages/TicketsPage';
import { DocumentiPage } from './pages/DocumentiPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { StudiPage } from './pages/StudiPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminMaintenancePage from './pages/AdminMaintenancePage';
import AuditLogsPage from './pages/AuditLogsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard-condivisa" element={<DashboardCondivisaPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/clienti" element={<ClientiPage />} />
                <Route path="/clienti/:id" element={<ClientiPage />} />
                <Route path="/debitori" element={<DebitoriPage />} />
                <Route path="/pratiche" element={<PratichePage />} />
                <Route path="/pratiche/:id" element={<PraticaDetailPage />} />
                <Route path="/avvocati" element={<AvvocatiPage />} />
                <Route path="/alert" element={<AlertsPage />} />
                <Route path="/ticket" element={<TicketsPage />} />
                <Route path="/documenti" element={<DocumentiPage />} />
                <Route path="/ricerca" element={<RicercaPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/studi" element={<StudiPage />} />
                <Route path="/admin/maintenance" element={<AdminMaintenancePage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
