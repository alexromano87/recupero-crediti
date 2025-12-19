// apps/frontend/src/pages/RicercaPage.tsx
import { useEffect, useState } from 'react';
import {
  Search,
  ChevronRight,
  Users,
  Building2,
  User,
  FileText,
  Bell,
  Ticket,
  X,
  ArrowRight,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '../components/Pagination';

import type { Cliente } from '../api/clienti';
import { fetchClienti } from '../api/clienti';
import type { Debitore } from '../api/debitori';
import {
  fetchDebitoriWithClientiCount,
  getDebitoreDisplayName,
  type DebitoreWithClientiCount,
} from '../api/debitori';
import type { Pratica } from '../api/pratiche';
import { fetchPratiche, formatCurrency, getDebitoreDisplayName as getPraticaDebitoreDisplayName } from '../api/pratiche';
import { fetchAlerts, type Alert } from '../api/alerts';
import { fetchTickets, type Ticket as TicketType, type TicketPriorita } from '../api/tickets';
import { useToast } from '../components/ui/ToastProvider';
import { DebitoreDetailModal } from '../components/ui/DebitoreDetailModal';

type TipoRisultato = 'cliente' | 'debitore' | 'pratica' | 'alert' | 'ticket';

type RisultatoRicerca = {
  tipo: TipoRisultato;
  data: any;
};

const formatoItalianoANumero = (valore: string) => {
  if (!valore) return '';
  const stringa = String(valore).replace(/\./g, '').replace(',', '.');
  return stringa;
};

const numeroAFormatoItaliano = (valore: string) => {
  if (!valore || valore === '0' || valore === '0.00') return '';
  const numero = parseFloat(valore);
  if (isNaN(numero)) return '';
  return numero.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function RicercaPage() {
  // === Stato dati ===
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [debitori, setDebitori] = useState<DebitoreWithClientiCount[]>([]);
  const [pratiche, setPratiche] = useState<Pratica[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // === Stato filtri ricerca ===
  const [termineRicerca, setTermineRicerca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<
    'tutti' | 'clienti' | 'debitori' | 'pratiche' | 'alerts' | 'tickets'
  >('tutti');
  const [filtroStato, setFiltroStato] = useState('tutti');
  const [valoreDa, setValoreDa] = useState('');
  const [valoreA, setValoreA] = useState('');
  const [tipoImporto, setTipoImporto] = useState<'capitale' | 'interessi' | 'anticipazioni' | 'compensi'>('capitale');
  const [categoriaImporto, setCategoriaImporto] = useState<'affidato' | 'recuperato' | 'da_recuperare'>('affidato');
  const [risultati, setRisultati] = useState<RisultatoRicerca[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [ricercaEffettuata, setRicercaEffettuata] = useState(false);

  // === Stato modale debitore ===
  const [selectedDebitore, setSelectedDebitore] = useState<Debitore | null>(null);
  const [isDebitoreModalOpen, setIsDebitoreModalOpen] = useState(false);

  // === Stato modale pratica ===
  const [selectedPratica, setSelectedPratica] = useState<Pratica | null>(null);
  const [isPraticaModalOpen, setIsPraticaModalOpen] = useState(false);

  // === Stato modale ticket ===
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const navigate = useNavigate();
  const { error: toastError } = useToast();

  // === Caricamento dati ===
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [clientiData, debitoriData, praticheData, alertsData, ticketsData] = await Promise.all([
          fetchClienti(true), // Include anche disattivati per ricerca completa
          fetchDebitoriWithClientiCount(true), // Include conteggio clienti per badge orfano
          fetchPratiche({ includeInactive: true }), // Include tutte le pratiche
          fetchAlerts(true), // Include tutti gli alert
          fetchTickets(true), // Include tutti i ticket
        ]);
        setClienti(clientiData);
        setDebitori(debitoriData);
        setPratiche(praticheData);
        setAlerts(alertsData);
        setTickets(ticketsData);
      } catch (e: any) {
        const msg = e?.message ?? 'Errore nel recupero dei dati';
        setError(msg);
        toastError(msg, 'Errore caricamento ricerca');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toastError]);

  // === Gestione focus/blur per i campi valore con formattazione italiana ===
  const handleValoreFocus = (campo: 'da' | 'a', valore: string) => {
    if (!valore) return;
    const numeroConvertito = formatoItalianoANumero(valore);
    if (campo === 'da') {
      setValoreDa(numeroConvertito);
    } else {
      setValoreA(numeroConvertito);
    }
  };

  const handleValoreBlur = (campo: 'da' | 'a', valore: string) => {
    if (!valore || valore.trim() === '') {
      if (campo === 'da') {
        setValoreDa('');
      } else {
        setValoreA('');
      }
      return;
    }
    const numeroConvertito = formatoItalianoANumero(valore);
    const numeroFormattato = numeroAFormatoItaliano(numeroConvertito);
    if (campo === 'da') {
      setValoreDa(numeroFormattato);
    } else {
      setValoreA(numeroFormattato);
    }
  };

  // === Helpers per label e icone ===
  const getPrioritaBadgeColor = (priorita: TicketPriorita) => {
    switch (priorita) {
      case 'urgente':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400';
      case 'alta':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400';
      case 'normale':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400';
      case 'bassa':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getPraticaNome = (id: string | null | undefined) => {
    if (!id) return 'N/D';
    const pratica = pratiche.find((p) => p.id === id);
    if (!pratica) return 'N/D';
    const cliente = clienti.find((c) => c.id === pratica.clienteId);
    const debitore = debitori.find((d) => d.id === pratica.debitoreId);
    return `${cliente?.ragioneSociale || 'N/D'} vs ${
      debitore?.ragioneSociale || 'N/D'
    }`;
  };

  const getTipoIcon = (tipo: TipoRisultato) => {
    switch (tipo) {
      case 'cliente':
        return Users;
      case 'debitore':
        return Building2;
      case 'pratica':
        return FileText;
      case 'alert':
        return Bell;
      case 'ticket':
        return Ticket;
      default:
        return FileText;
    }
  };

  const getTipoColor = (tipo: TipoRisultato) => {
    switch (tipo) {
      case 'cliente':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200';
      case 'debitore':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200';
      case 'pratica':
        return 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200';
      case 'alert':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200';
      case 'ticket':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/60 dark:text-gray-200';
    }
  };

  const getTipoLabel = (tipo: TipoRisultato) => {
    switch (tipo) {
      case 'cliente':
        return 'Cliente';
      case 'debitore':
        return 'Debitore';
      case 'pratica':
        return 'Pratica';
      case 'alert':
        return 'Alert';
      case 'ticket':
        return 'Ticket';
      default:
        return tipo;
    }
  };

  // === Navigazione al dettaglio ===
  const visualizzaDettaglio = (risultato: RisultatoRicerca) => {
    switch (risultato.tipo) {
      case 'cliente':
        navigate('/clienti');
        break;
      case 'debitore':
        // Apre la modale con i dettagli del debitore
        setSelectedDebitore(risultato.data as Debitore);
        setIsDebitoreModalOpen(true);
        break;
      case 'pratica':
        // Apre la modale con i dettagli della pratica
        setSelectedPratica(risultato.data as Pratica);
        setIsPraticaModalOpen(true);
        break;
      case 'alert':
        navigate('/alert');
        break;
      case 'ticket':
        // Apre la modale con i dettagli del ticket
        setSelectedTicket(risultato.data as TicketType);
        setIsTicketModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Handler per chiusura modale debitore
  const handleCloseDebitoreModal = () => {
    setIsDebitoreModalOpen(false);
    setSelectedDebitore(null);
  };

  // Handler quando un debitore orfano viene collegato
  const handleDebitoreLinked = () => {
    // Potresti voler aggiornare i risultati di ricerca qui
    // Per ora non facciamo nulla, la modale si aggiornerà da sola
  };

  // Handler per chiusura modale pratica
  const handleClosePraticaModal = () => {
    setIsPraticaModalOpen(false);
    setSelectedPratica(null);
  };

  // Handler per navigare alla pratica
  const handleGoToPratica = () => {
    if (selectedPratica?.id) {
      navigate(`/pratiche?id=${selectedPratica.id}`);
    }
  };


  // === Funzione principale di ricerca (per ora clienti + struttura pronta per il resto) ===
  const eseguiRicerca = () => {
    // Se nessun filtro attivo, resetta
    if (
      !termineRicerca.trim() &&
      filtroTipo === 'tutti' &&
      filtroStato === 'tutti' &&
      !valoreDa &&
      !valoreA
    ) {
      setRisultati([]);
      setRicercaEffettuata(false);
      return;
    }

    const termine = termineRicerca.toLowerCase();
    let risultatiTrovati: RisultatoRicerca[] = [];

    // === CLIENTI ===
    if (filtroTipo === 'tutti' || filtroTipo === 'clienti') {
      const clientiTrovati = clienti
        .filter((c) => {
          return (
            c.ragioneSociale?.toLowerCase().includes(termine) ||
            c.email?.toLowerCase().includes(termine) ||
            c.telefono?.includes(termine) ||
            c.indirizzo?.toLowerCase().includes(termine) ||
            c.citta?.toLowerCase().includes(termine) ||
            c.partitaIva?.toLowerCase().includes(termine)
          );
        })
        .map((c) => ({ tipo: 'cliente' as const, data: c }));
      risultatiTrovati = [...risultatiTrovati, ...clientiTrovati];
    }

    // === DEBITORI ===
    if (filtroTipo === 'tutti' || filtroTipo === 'debitori') {
      const debitoriTrovati = debitori
        .filter((d: Debitore) => {
          const displayName = getDebitoreDisplayName(d).toLowerCase();
          return (
            displayName.includes(termine) ||
            d.ragioneSociale?.toLowerCase().includes(termine) ||
            d.nome?.toLowerCase().includes(termine) ||
            d.cognome?.toLowerCase().includes(termine) ||
            d.codiceFiscale?.toLowerCase().includes(termine) ||
            d.partitaIva?.toLowerCase().includes(termine) ||
            d.email?.toLowerCase().includes(termine) ||
            d.telefono?.includes(termine) ||
            d.citta?.toLowerCase().includes(termine)
          );
        })
        .map((d: DebitoreWithClientiCount) => ({ tipo: 'debitore' as const, data: d }));
      risultatiTrovati = [...risultatiTrovati, ...debitoriTrovati];
    }

    // === PRATICHE (struttura pronta, ma pratiche[] è vuoto) ===
    if (filtroTipo === 'tutti' || filtroTipo === 'pratiche') {
      let praticheTrovate = pratiche.filter((p: any) => {
        const cliente = clienti.find((c) => c.id === p.clienteId);
        const debitore = debitori.find((d) => d.id === p.debitoreId);

        const matchTermine =
          !termine ||
          cliente?.ragioneSociale?.toLowerCase().includes(termine) ||
          debitore?.ragioneSociale?.toLowerCase().includes(termine) ||
          p.fase?.toLowerCase().includes(termine) ||
          p.note?.toLowerCase().includes(termine) ||
          p.capitale?.toString().includes(termine);

        let matchValore = true;
        if (valoreDa || valoreA) {
          // Determina quale campo usare in base al tipo e categoria
          let valoreDaConfronto = 0;

          if (tipoImporto === 'capitale') {
            if (categoriaImporto === 'affidato') {
              valoreDaConfronto = parseFloat(p.capitale) || 0;
            } else if (categoriaImporto === 'recuperato') {
              valoreDaConfronto = parseFloat(p.importoRecuperatoCapitale) || 0;
            } else if (categoriaImporto === 'da_recuperare') {
              valoreDaConfronto = (parseFloat(p.capitale) || 0) - (parseFloat(p.importoRecuperatoCapitale) || 0);
            }
          } else if (tipoImporto === 'interessi') {
            if (categoriaImporto === 'affidato') {
              valoreDaConfronto = parseFloat(p.interessi) || 0;
            } else if (categoriaImporto === 'recuperato') {
              valoreDaConfronto = parseFloat(p.interessiRecuperati) || 0;
            } else if (categoriaImporto === 'da_recuperare') {
              valoreDaConfronto = (parseFloat(p.interessi) || 0) - (parseFloat(p.interessiRecuperati) || 0);
            }
          } else if (tipoImporto === 'anticipazioni') {
            if (categoriaImporto === 'affidato') {
              valoreDaConfronto = parseFloat(p.anticipazioni) || 0;
            } else if (categoriaImporto === 'recuperato') {
              valoreDaConfronto = parseFloat(p.importoRecuperatoAnticipazioni) || 0;
            } else if (categoriaImporto === 'da_recuperare') {
              valoreDaConfronto = (parseFloat(p.anticipazioni) || 0) - (parseFloat(p.importoRecuperatoAnticipazioni) || 0);
            }
          } else if (tipoImporto === 'compensi') {
            if (categoriaImporto === 'affidato') {
              valoreDaConfronto = parseFloat(p.compensiLegali) || 0;
            } else if (categoriaImporto === 'recuperato') {
              valoreDaConfronto = parseFloat(p.compensiLiquidati) || 0;
            } else if (categoriaImporto === 'da_recuperare') {
              valoreDaConfronto = (parseFloat(p.compensiLegali) || 0) - (parseFloat(p.compensiLiquidati) || 0);
            }
          }

          const da = valoreDa
            ? parseFloat(formatoItalianoANumero(valoreDa))
            : 0;
          const a = valoreA
            ? parseFloat(formatoItalianoANumero(valoreA))
            : Infinity;

          if (valoreDa && valoreA) {
            matchValore = valoreDaConfronto >= da && valoreDaConfronto <= a;
          } else if (valoreDa) {
            matchValore = valoreDaConfronto >= da;
          } else if (valoreA) {
            matchValore = valoreDaConfronto <= a;
          }
        }

        return matchTermine && matchValore;
      });

      // filtro stato pratiche
      if (filtroStato === 'aperte') {
        praticheTrovate = praticheTrovate.filter((p: any) => p.aperta);
      } else if (filtroStato === 'chiuse') {
        praticheTrovate = praticheTrovate.filter((p: any) => !p.aperta);
      }

      risultatiTrovati = [
        ...risultatiTrovati,
        ...praticheTrovate.map((p: any) => ({
          tipo: 'pratica' as const,
          data: p,
        })),
      ];
    }

    // === ALERTS (placeholder) ===
    if (filtroTipo === 'tutti' || filtroTipo === 'alerts') {
      let alertsTrovati = alerts.filter((a: any) => {
        const pratica = pratiche.find((p: any) => p.id === a.praticaId);
        const cliente = pratica
          ? clienti.find((c) => c.id === pratica.clienteId)
          : null;
        const debitore = pratica
          ? debitori.find((d) => d.id === pratica.debitoreId)
          : null;

        return (
          a.titolo?.toLowerCase().includes(termine) ||
          a.note?.toLowerCase().includes(termine) ||
          cliente?.ragioneSociale?.toLowerCase().includes(termine) ||
          debitore?.ragioneSociale?.toLowerCase().includes(termine)
        );
      });

      if (filtroStato === 'in_gestione') {
        alertsTrovati = alertsTrovati.filter(
          (a: any) => a.stato === 'in_gestione',
        );
      } else if (filtroStato === 'chiuso') {
        alertsTrovati = alertsTrovati.filter((a: any) => a.stato === 'chiuso');
      }

      risultatiTrovati = [
        ...risultatiTrovati,
        ...alertsTrovati.map((a: any) => ({
          tipo: 'alert' as const,
          data: a,
        })),
      ];
    }

    // === TICKETS ===
    if (filtroTipo === 'tutti' || filtroTipo === 'tickets') {
      let ticketsTrovati = tickets.filter((t: any) => {
        const pratica = pratiche.find((p: any) => p.id === t.praticaId);
        const cliente = pratica
          ? clienti.find((c) => c.id === pratica.clienteId)
          : null;
        const debitore = pratica
          ? debitori.find((d) => d.id === pratica.debitoreId)
          : null;

        return (
          String(t.numeroTicket).includes(termine) ||
          t.oggetto?.toLowerCase().includes(termine) ||
          t.descrizione?.toLowerCase().includes(termine) ||
          t.autore?.toLowerCase().includes(termine) ||
          cliente?.ragioneSociale?.toLowerCase().includes(termine) ||
          debitore?.ragioneSociale?.toLowerCase().includes(termine)
        );
      });

      if (filtroStato === 'aperto') {
        ticketsTrovati = ticketsTrovati.filter((t: any) => t.stato === 'aperto');
      } else if (filtroStato === 'chiuso') {
        ticketsTrovati = ticketsTrovati.filter(
          (t: any) => t.stato === 'chiuso' || t.stato === 'risolto',
        );
      }

      risultatiTrovati = [
        ...risultatiTrovati,
        ...ticketsTrovati.map((t: any) => ({
          tipo: 'ticket' as const,
          data: t,
        })),
      ];
    }

    setRisultati(risultatiTrovati);
    setRicercaEffettuata(true);
  };

  // === Render ===
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Strumenti
        </p>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          Ricerca avanzata
        </h1>
        <p className="max-w-2xl text-xs text-slate-500 dark:text-slate-400">
          Cerca trasversalmente tra clienti, debitori, pratiche, alert e ticket.
          Puoi filtrare per tipo, stato e range di importo affidato.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-100 shadow-sm shadow-rose-900/40">
          {error}
        </div>
      )}

      {/* Pannello filtri */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-md shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-black/40">
        <div className="space-y-4">
          {/* Campo ricerca */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Cerca
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={termineRicerca}
                onChange={(e) => setTermineRicerca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') eseguiRicerca();
                }}
                placeholder="Inserisci nome, email, telefono, fase, importo..."
                className="flex-1 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-50 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={eseguiRicerca}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-900/40 transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <Search className="h-4 w-4" />
                Cerca
              </button>
            </div>
          </div>

          {/* Filtri avanzati */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Tipo */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => {
                  const value = e.target.value as typeof filtroTipo;
                  setFiltroTipo(value);
                  setFiltroStato('tutti');
                  if (value !== 'pratiche' && value !== 'tutti') {
                    setValoreDa('');
                    setValoreA('');
                  }
                }}
                className="mt-0 w-full appearance-none rounded-md border border-slate-200 bg-white/90 px-3 py-2 pr-8 text-xs text-slate-900 shadow-sm shadow-slate-200/60 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40"
              >
                <option value="tutti">Tutti i tipi</option>
                <option value="clienti">Clienti</option>
                <option value="debitori">Debitori</option>
                <option value="pratiche">Pratiche</option>
                <option value="alerts">Alert &amp; scadenze</option>
                <option value="tickets">Tickets</option>
              </select>
            </div>

            {/* Stato */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Stato
              </label>
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value)}
                className="mt-0 w-full appearance-none rounded-md border border-slate-200 bg-white/90 px-3 py-2 pr-8 text-xs text-slate-900 shadow-sm shadow-slate-200/60 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:shadow-black/40"
                disabled={
                  filtroTipo !== 'pratiche' &&
                  filtroTipo !== 'alerts' &&
                  filtroTipo !== 'tickets' &&
                  filtroTipo !== 'tutti'
                }
              >
                <option value="tutti">Tutti gli stati</option>

                {(filtroTipo === 'pratiche' || filtroTipo === 'tutti') && (
                  <>
                    <option value="aperte">Pratiche aperte</option>
                    <option value="chiuse">Pratiche chiuse</option>
                  </>
                )}

                {filtroTipo === 'alerts' && (
                  <>
                    <option value="in_gestione">Alert in gestione</option>
                    <option value="chiuso">Alert chiusi</option>
                  </>
                )}

                {filtroTipo === 'tickets' && (
                  <>
                    <option value="aperto">Ticket aperti</option>
                    <option value="chiuso">Ticket chiusi/risolti</option>
                  </>
                )}
              </select>
            </div>

            {/* Filtri importi avanzati */}
            <div className="space-y-3">
              {/* Tipo importo */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Tipo importo{' '}
                  {filtroTipo === 'pratiche' || filtroTipo === 'tutti'
                    ? ''
                    : ' (solo pratiche)'}
                </label>
                <select
                  value={tipoImporto}
                  onChange={(e) => setTipoImporto(e.target.value as 'capitale' | 'interessi' | 'anticipazioni' | 'compensi')}
                  disabled={filtroTipo !== 'pratiche' && filtroTipo !== 'tutti'}
                  className="w-full rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-50 dark:disabled:bg-slate-900/60"
                >
                  <option value="capitale">Capitale</option>
                  <option value="interessi">Interessi</option>
                  <option value="anticipazioni">Anticipazioni</option>
                  <option value="compensi">Compensi legali</option>
                </select>
              </div>

              {/* Categoria importo */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Categoria{' '}
                  {filtroTipo === 'pratiche' || filtroTipo === 'tutti'
                    ? ''
                    : ' (solo pratiche)'}
                </label>
                <select
                  value={categoriaImporto}
                  onChange={(e) => setCategoriaImporto(e.target.value as 'affidato' | 'recuperato' | 'da_recuperare')}
                  disabled={filtroTipo !== 'pratiche' && filtroTipo !== 'tutti'}
                  className="w-full rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-50 dark:disabled:bg-slate-900/60"
                >
                  <option value="affidato">Affidato</option>
                  <option value="recuperato">Recuperato</option>
                  <option value="da_recuperare">Da recuperare</option>
                </select>
              </div>

              {/* Range valore */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Valore (€){' '}
                  {filtroTipo === 'pratiche' || filtroTipo === 'tutti'
                    ? ''
                    : ' (solo pratiche)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={valoreDa}
                    onChange={(e) => setValoreDa(e.target.value)}
                    onFocus={(e) => handleValoreFocus('da', e.target.value)}
                    onBlur={(e) => handleValoreBlur('da', e.target.value)}
                    placeholder="Da (es. 1.000,00)"
                    disabled={
                      filtroTipo !== 'pratiche' && filtroTipo !== 'tutti'
                    }
                    className="flex-1 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-50 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900/60"
                  />
                  <input
                    type="text"
                    value={valoreA}
                    onChange={(e) => setValoreA(e.target.value)}
                    onFocus={(e) => handleValoreFocus('a', e.target.value)}
                    onBlur={(e) => handleValoreBlur('a', e.target.value)}
                    placeholder="A (es. 50.000,00)"
                    disabled={
                      filtroTipo !== 'pratiche' && filtroTipo !== 'tutti'
                    }
                    className="flex-1 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-900 shadow-sm placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-50 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900/60"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Suggerimento */}
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-200">
              Suggerimento:{' '}
            </span>
            Puoi cercare per ragione sociale, email, telefono, fase, importi o
            note. Usa i filtri avanzati per cercare per tipo importo (capitale, interessi, anticipazioni, compensi)
            e categoria (affidato, recuperato, da recuperare).
          </div>
        </div>
      </div>

      {/* Area risultati */}
      {loading && !ricercaEffettuata ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-xs text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
          Caricamento dati per la ricerca...
        </div>
      ) : !ricercaEffettuata ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
          <Search className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Cerca nel database
          </p>
          <p className="mt-1 max-w-md">
            Inserisci un termine e applica i filtri per trovare rapidamente
            clienti, debitori, pratiche, alert e ticket correlati.
          </p>
        </div>
      ) : risultati.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/90 p-10 text-center text-xs text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
          <Search className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Nessun risultato trovato
          </p>
          <p className="mt-1 max-w-md">
            Prova a modificare i termini di ricerca o ad allentare i filtri.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          {/* Header risultati */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-slate-700 dark:text-slate-200">
              Trovati{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                {risultati.length}
              </span>{' '}
              risultati
            </p>
            {(valoreDa || valoreA) && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Filtro importi:</span>
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-medium text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-100">
                  {tipoImporto === 'capitale' && 'Capitale'}
                  {tipoImporto === 'interessi' && 'Interessi'}
                  {tipoImporto === 'anticipazioni' && 'Anticipazioni'}
                  {tipoImporto === 'compensi' && 'Compensi'}{' '}
                  ({categoriaImporto === 'affidato' && 'Affidato'}
                  {categoriaImporto === 'recuperato' && 'Recuperato'}
                  {categoriaImporto === 'da_recuperare' && 'Da recuperare'})
                  {' - '}
                  {valoreDa && `Da €${valoreDa}`}{' '}
                  {valoreDa && valoreA && ' - '}{' '}
                  {valoreA && `A €${valoreA}`}
                </span>
              </div>
            )}
          </div>

          {/* Elenco risultati */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {risultati
              .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
              .map((risultato, index) => {
              const Icon = getTipoIcon(risultato.tipo);

              return (
                <div
                  key={`${risultato.tipo}-${risultato.data.id ?? index}`}
                  className="cursor-pointer px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-900/60"
                  onClick={() => visualizzaDettaglio(risultato)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-start gap-3">
                      {/* Icona */}
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Contenuto */}
                      <div className="min-w-0 flex-1">
                        {/* Badge tipo + stato */}
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTipoColor(
                              risultato.tipo,
                            )}`}
                          >
                            {getTipoLabel(risultato.tipo)}
                          </span>

                          {/* Badge orfano/collegato per debitori */}
                          {risultato.tipo === 'debitore' && (
                            risultato.data.clientiCount === 0 ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                                ⚠️ Orfano
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                                {risultato.data.clientiCount} cliente{risultato.data.clientiCount > 1 ? 'i' : ''}
                              </span>
                            )
                          )}

                          {/* Badge stati specifici per pratiche */}
                          {risultato.tipo === 'pratica' && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                              {/* Qui potrai usare p.aperta/esito */}
                              Stato pratica
                            </span>
                          )}
                        </div>

                        {/* Titolo principale */}
                        <h4 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {risultato.tipo === 'cliente'
                            ? risultato.data.ragioneSociale
                            : risultato.tipo === 'debitore'
                              ? getDebitoreDisplayName(risultato.data)
                              : risultato.tipo === 'pratica'
                                ? getPraticaNome(
                                    risultato.data.clienteId
                                      ? risultato.data.id
                                      : risultato.data.praticaId,
                                  )
                                : risultato.tipo === 'alert'
                                  ? risultato.data.titolo ?? 'Alert'
                                  : risultato.data.oggetto ?? 'Ticket'}
                        </h4>

                        {/* Dettagli sintetici */}
                        <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                          {risultato.tipo === 'cliente' && (
                            <>
                              {risultato.data.partitaIva && (
                                <p>
                                  <span className="font-medium">P.IVA:</span>{' '}
                                  {risultato.data.partitaIva}
                                </p>
                              )}
                              {risultato.data.email && (
                                <p>
                                  <span className="font-medium">Email:</span>{' '}
                                  {risultato.data.email}
                                </p>
                              )}
                              {risultato.data.telefono && (
                                <p>
                                  <span className="font-medium">Tel:</span>{' '}
                                  {risultato.data.telefono}
                                </p>
                              )}
                              {risultato.data.citta && (
                                <p>
                                  <span className="font-medium">Sede:</span>{' '}
                                  {risultato.data.citta}
                                  {risultato.data.provincia && ` (${risultato.data.provincia})`}
                                </p>
                              )}
                              {risultato.data.attivo === false && (
                                <p className="text-amber-600 dark:text-amber-400">
                                  <span className="font-medium">⚠️ Disattivato</span>
                                </p>
                              )}
                            </>
                          )}

                          {risultato.tipo === 'debitore' && (
                            <>
                              <p>
                                <span className="font-medium">Tipo:</span>{' '}
                                {risultato.data.tipoSoggetto === 'persona_fisica' ? 'Persona fisica' : 'Persona giuridica'}
                              </p>
                              {risultato.data.codiceFiscale && (
                                <p>
                                  <span className="font-medium">C.F.:</span>{' '}
                                  {risultato.data.codiceFiscale}
                                </p>
                              )}
                              {risultato.data.partitaIva && (
                                <p>
                                  <span className="font-medium">P.IVA:</span>{' '}
                                  {risultato.data.partitaIva}
                                </p>
                              )}
                              {risultato.data.email && (
                                <p>
                                  <span className="font-medium">Email:</span>{' '}
                                  {risultato.data.email}
                                </p>
                              )}
                              {risultato.data.telefono && (
                                <p>
                                  <span className="font-medium">Tel:</span>{' '}
                                  {risultato.data.telefono}
                                </p>
                              )}
                              {risultato.data.citta && (
                                <p>
                                  <span className="font-medium">Sede:</span>{' '}
                                  {risultato.data.citta}
                                  {risultato.data.provincia && ` (${risultato.data.provincia})`}
                                </p>
                              )}
                              {risultato.data.attivo === false && (
                                <p className="text-amber-600 dark:text-amber-400">
                                  <span className="font-medium">⚠️ Disattivato</span>
                                </p>
                              )}
                            </>
                          )}

                          {risultato.tipo === 'pratica' && (
                            <>
                              <p>
                                <span className="font-medium">Cliente:</span>{' '}
                                {risultato.data.cliente?.ragioneSociale}
                              </p>
                              <p>
                                <span className="font-medium">Debitore:</span>{' '}
                                {getPraticaDebitoreDisplayName(risultato.data.debitore)}
                              </p>
                              <p>
                                <span className="font-medium">Capitale:</span> €{' '}
                                {formatCurrency(risultato.data.capitale)}
                              </p>
                              <p>
                                <span className="font-medium">Stato:</span>{' '}
                                {risultato.data.aperta ? 'Aperta' : 'Chiusa'}
                              </p>
                            </>
                          )}

                          {risultato.tipo === 'alert' && (
                            <>
                              <p>
                                <span className="font-medium">Descrizione:</span>{' '}
                                {risultato.data.descrizione}
                              </p>
                              <p>
                                <span className="font-medium">Scadenza:</span>{' '}
                                {new Date(risultato.data.dataScadenza).toLocaleDateString('it-IT')}
                              </p>
                              <p>
                                <span className="font-medium">Destinatario:</span>{' '}
                                {risultato.data.destinatario === 'studio' ? 'Studio' : 'Cliente'}
                              </p>
                              <p>
                                <span className="font-medium">Stato:</span>{' '}
                                {risultato.data.stato === 'in_gestione' ? 'In gestione' : 'Chiuso'}
                              </p>
                              {risultato.data.pratica && (
                                <p>
                                  <span className="font-medium">Pratica:</span>{' '}
                                  {risultato.data.pratica.cliente?.ragioneSociale} vs{' '}
                                  {getPraticaDebitoreDisplayName(risultato.data.pratica.debitore)}
                                </p>
                              )}
                            </>
                          )}

                          {risultato.tipo === 'ticket' && (
                            <>
                              <p>
                                <span className="font-medium">Numero Ticket:</span>{' '}
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                  #{risultato.data.numeroTicket}
                                </span>
                              </p>
                              <p>
                                <span className="font-medium">Descrizione:</span>{' '}
                                {risultato.data.descrizione}
                              </p>
                              <p>
                                <span className="font-medium">Richiedente:</span>{' '}
                                {risultato.data.autore}
                              </p>
                              <p>
                                <span className="font-medium">Priorità:</span>{' '}
                                {risultato.data.priorita.charAt(0).toUpperCase() + risultato.data.priorita.slice(1)}
                              </p>
                              <p>
                                <span className="font-medium">Stato:</span>{' '}
                                {risultato.data.stato === 'aperto' ? 'Aperto' : risultato.data.stato === 'in_gestione' ? 'In gestione' : 'Chiuso'}
                              </p>
                              {risultato.data.pratica && (
                                <p>
                                  <span className="font-medium">Pratica:</span>{' '}
                                  {risultato.data.pratica.cliente?.ragioneSociale} vs{' '}
                                  {getPraticaDebitoreDisplayName(risultato.data.pratica.debitore)}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Freccia */}
                    <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-300 dark:text-slate-600" />
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(risultati.length / ITEMS_PER_PAGE)}
            totalItems={risultati.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modale dettaglio debitore */}
      <DebitoreDetailModal
        isOpen={isDebitoreModalOpen}
        onClose={handleCloseDebitoreModal}
        debitore={selectedDebitore}
        onLinked={handleDebitoreLinked}
      />

      {/* Modale dettaglio pratica */}
      {isPraticaModalOpen && selectedPratica && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClosePraticaModal}
          />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Dettaglio Pratica
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedPratica.cliente?.ragioneSociale} vs {getPraticaDebitoreDisplayName(selectedPratica.debitore)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClosePraticaModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
              {/* Stato pratica */}
              <div className="flex items-center gap-2">
                {selectedPratica.aperta ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                    <Clock className="h-3.5 w-3.5" />
                    In corso
                  </span>
                ) : selectedPratica.esito === 'positivo' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Chiusa con esito positivo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400">
                    <XCircle className="h-3.5 w-3.5" />
                    Chiusa con esito negativo
                  </span>
                )}
                {!selectedPratica.attivo && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                    Disattivata
                  </span>
                )}
              </div>

              {/* Informazioni principali */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Cliente
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedPratica.cliente?.ragioneSociale || 'N/D'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Debitore
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {getPraticaDebitoreDisplayName(selectedPratica.debitore)}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Capitale
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    € {formatCurrency(selectedPratica.capitale)}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Data affidamento
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedPratica.dataAffidamento
                      ? new Date(selectedPratica.dataAffidamento).toLocaleDateString('it-IT')
                      : 'N/D'}
                  </p>
                </div>
              </div>

              {/* Importi recuperati */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide mb-3">
                  Importi Recuperati
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Capitale</p>
                    <p className="font-bold text-emerald-900 dark:text-emerald-100">
                      € {formatCurrency(selectedPratica.importoRecuperatoCapitale || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Anticipazioni</p>
                    <p className="font-bold text-emerald-900 dark:text-emerald-100">
                      € {formatCurrency(selectedPratica.importoRecuperatoAnticipazioni || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Compensi legali</p>
                    <p className="font-bold text-emerald-900 dark:text-emerald-100">
                      € {formatCurrency(selectedPratica.compensiLiquidati || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Interessi</p>
                    <p className="font-bold text-emerald-900 dark:text-emerald-100">
                      € {formatCurrency(selectedPratica.interessiRecuperati || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Note */}
              {selectedPratica.note && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                    Note
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {selectedPratica.note}
                  </p>
                </div>
              )}
            </div>

            {/* Footer con pulsante "Vai alla pratica" */}
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={handleClosePraticaModal}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Chiudi
              </button>
              <button
                onClick={handleGoToPratica}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition"
              >
                Vai alla pratica
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Dettaglio Ticket */}
      {isTicketModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedTicket.oggetto}
                </h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPrioritaBadgeColor(selectedTicket.priorita)}`}>
                    {selectedTicket.priorita === 'urgente' && <AlertTriangle className="h-3 w-3" />}
                    {selectedTicket.priorita.charAt(0).toUpperCase() + selectedTicket.priorita.slice(1)}
                  </span>
                  {selectedTicket.stato === 'aperto' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                      <Clock className="h-3 w-3" />
                      Aperto
                    </span>
                  )}
                  {selectedTicket.stato === 'in_gestione' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                      <PlayCircle className="h-3 w-3" />
                      In gestione
                    </span>
                  )}
                  {selectedTicket.stato === 'chiuso' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      <CheckCircle className="h-3 w-3" />
                      Chiuso
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Descrizione */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                  Descrizione
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {selectedTicket.descrizione}
                </p>
              </div>

              {/* Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Numero Ticket
                  </h3>
                  <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    #{selectedTicket.numeroTicket}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Richiedente
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedTicket.autore}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Data Creazione
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {new Date(selectedTicket.dataCreazione).toLocaleString('it-IT')}
                  </p>
                </div>
              </div>

              {/* Pratica */}
              {selectedTicket.pratica ? (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Pratica Collegata
                  </h3>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>Cliente:</strong> {selectedTicket.pratica.cliente?.ragioneSociale}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                      <strong>Debitore:</strong> {getPraticaDebitoreDisplayName(selectedTicket.pratica.debitore)}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Pratica
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    Richiesta generica (non collegata a pratica)
                  </p>
                </div>
              )}

              {/* Messaggi */}
              {selectedTicket.messaggi && selectedTicket.messaggi.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Messaggi ({selectedTicket.messaggi.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedTicket.messaggi.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.autore === 'studio' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.autore === 'studio'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <p className="text-xs font-medium mb-1">
                            {msg.autore === 'studio' ? 'Studio' : 'Cliente'}
                          </p>
                          <p className="text-sm">{msg.testo}</p>
                          <p className="text-[10px] mt-1 opacity-70">
                            {new Date(msg.dataInvio).toLocaleString('it-IT')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Chiudi
              </button>
              <button
                onClick={() => {
                  setIsTicketModalOpen(false);
                  navigate(`/ticket?id=${selectedTicket.id}`);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition"
              >
                Vai al ticket
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RicercaPage;