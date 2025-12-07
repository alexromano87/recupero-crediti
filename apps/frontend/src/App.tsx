import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { ClientiPage } from './pages/ClientiPage';
import { RicercaPage } from './pages/RicercaPage';
import { DebitoriPage } from './pages/DebitoriPage';


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

function PratichePage() {
  return <h2 className="text-xl font-semibold">Pratiche (placeholder)</h2>;
}

function AlertPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
        Alert & scadenze
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Qui vedremo il calendario delle scadenze, gli alert in gestione e quelli chiusi,
        con filtri per pratica, cliente e responsabile.
      </p>
    </div>
  );
}

function TicketClientiPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
        Ticket clienti
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Qui gestiremo i ticket aperti dalle società clienti: stato, assegnatario,
        cronologia e collegamento alle pratiche.
      </p>
    </div>
  );
}


function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clienti" element={<ClientiPage />} />
        <Route path="/clienti/:id" element={<ClientiPage />} /> 
        <Route path="/debitori" element={<DebitoriPage />} />
        <Route path="/pratiche" element={<PratichePage />} />
        <Route path="/alert" element={<AlertPage />} />
        <Route path="/ticket" element={<TicketClientiPage />} />
        <Route path="/ricerca" element={<RicercaPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
