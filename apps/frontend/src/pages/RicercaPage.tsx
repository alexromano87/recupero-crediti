// apps/frontend/src/pages/RicercaPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Search,
  ChevronRight,
  Users,
  Building2,
  User,
  FileText,
  Bell,
  Ticket,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Cliente } from '../api/clienti';
import { fetchClienti } from '../api/clienti';
import type { Debitore } from '../api/debitori';
import { fetchDebitori, getDebitoreDisplayName, fetchClientiForDebitore } from '../api/debitori';
import { useToast } from '../components/ui/ToastProvider';

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
  const [debitori, setDebitori] = useState<Debitore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder per quando avremo API anche per questi
  const [pratiche] = useState<any[]>([]);
  const [alerts] = useState<any[]>([]);
  const [tickets] = useState<any[]>([]);

  // === Stato filtri ricerca ===
  const [termineRicerca, setTermineRicerca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<
    'tutti' | 'clienti' | 'debitori' | 'pratiche' | 'alerts' | 'tickets'
  >('tutti');
  const [filtroStato, setFiltroStato] = useState('tutti');
  const [valoreDa, setValoreDa] = useState('');
  const [valoreA, setValoreA] = useState('');
  const [risultati, setRisultati] = useState<RisultatoRicerca[]>([]);
  const [ricercaEffettuata, setRicercaEffettuata] = useState(false);

  const navigate = useNavigate();
  const { error: toastError } = useToast();

  // === Caricamento dati ===
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [clientiData, debitoriData] = await Promise.all([
          fetchClienti(true), // Include anche disattivati per ricerca completa
          fetchDebitori(true),
        ]);
        setClienti(clientiData);
        setDebitori(debitoriData);
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
  const getClienteNome = (id: string) => {
    const cliente = clienti.find((c) => c.id === id);
    return cliente ? cliente.ragioneSociale : 'N/D';
  };

  const getDebitoreNome = (id: string) => {
    const debitore = debitori.find((d) => d.id === id);
    return debitore ? debitore.ragioneSociale : 'N/D';
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
  const visualizzaDettaglio = async (risultato: RisultatoRicerca) => {
    switch (risultato.tipo) {
      case 'cliente':
        if (risultato.data?.id) {
          navigate(`/clienti/${risultato.data.id}`);
        } else {
          navigate('/clienti');
        }
        break;
      case 'debitore':
        if (risultato.data?.id) {
          // Trova i clienti collegati al debitore
          try {
            const { clientiIds } = await fetchClientiForDebitore(risultato.data.id);
            if (clientiIds.length > 0) {
              // Ha almeno un cliente collegato: vai a DebitoriPage con cliente e debitore preselezionati
              navigate(`/debitori?clienteId=${clientiIds[0]}&debitoreId=${risultato.data.id}`);
            } else {
              // Debitore orfano: vai a DebitoriPage con solo il debitore (mostra modale per ricollegarlo)
              navigate(`/debitori?debitoreId=${risultato.data.id}&orfano=true`);
            }
          } catch (err) {
            console.error('Errore nel recupero clienti per debitore:', err);
            navigate('/debitori');
          }
        } else {
          navigate('/debitori');
        }
        break;
      case 'pratica':
        navigate('/pratiche');
        break;
      case 'alert':
        navigate('/alert');
        break;
      case 'ticket':
        navigate('/ticket');
        break;
      default:
        break;
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
        .map((d: Debitore) => ({ tipo: 'debitore' as const, data: d }));
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
          const capitaleNum = parseFloat(p.capitale) || 0;
          const da = valoreDa
            ? parseFloat(formatoItalianoANumero(valoreDa))
            : 0;
          const a = valoreA
            ? parseFloat(formatoItalianoANumero(valoreA))
            : Infinity;

          if (valoreDa && valoreA) {
            matchValore = capitaleNum >= da && capitaleNum <= a;
          } else if (valoreDa) {
            matchValore = capitaleNum >= da;
          } else if (valoreA) {
            matchValore = capitaleNum <= a;
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

    // === TICKETS (placeholder) ===
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

            {/* Valore capitale */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Valore capitale (€){' '}
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

          {/* Suggerimento */}
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-200">
              Suggerimento:{' '}
            </span>
            Puoi cercare per ragione sociale, email, telefono, fase, importi o
            note. Usa il filtro “Valore” per cercare pratiche in un range di
            capitale specifico.
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
                <span className="text-[11px] text-slate-500">Filtro valore:</span>
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-medium text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-100">
                  {valoreDa && `Da €${valoreDa}`}{' '}
                  {valoreDa && valoreA && ' - '}{' '}
                  {valoreA && `A €${valoreA}`}
                </span>
              </div>
            )}
          </div>

          {/* Elenco risultati */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {risultati.map((risultato, index) => {
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

                          {/* Badge stati specifici: placeholder, si attiveranno quando avremo i dati */}
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
                            <p className="italic text-slate-500 dark:text-slate-400">
                              Dettagli pratica verranno popolati quando le API
                              saranno disponibili.
                            </p>
                          )}

                          {(risultato.tipo === 'alert' ||
                            risultato.tipo === 'ticket') && (
                            <p className="italic text-slate-500 dark:text-slate-400">
                              Dettagli {risultato.tipo} verranno popolati con i
                              dati reali una volta implementate le relative
                              entità.
                            </p>
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
        </div>
      )}
    </div>
  );
}

export default RicercaPage;