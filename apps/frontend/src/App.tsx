import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ClientiPage } from './pages/ClientiPage';

function DashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
        Dashboard
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Qui metteremo KPI, grafici e riepilogo pratiche.
      </p>
    </div>
  );
}

function DebitoriPage() {
  return <h2 className="text-xl font-semibold">Debitori (placeholder)</h2>;
}

function PratichePage() {
  return <h2 className="text-xl font-semibold">Pratiche (placeholder)</h2>;
}

function RicercaPage() {
  return <h2 className="text-xl font-semibold">Ricerca avanzata (placeholder)</h2>;
}

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clienti" element={<ClientiPage />} />
        <Route path="/debitori" element={<DebitoriPage />} />
        <Route path="/pratiche" element={<PratichePage />} />
        <Route path="/ricerca" element={<RicercaPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
