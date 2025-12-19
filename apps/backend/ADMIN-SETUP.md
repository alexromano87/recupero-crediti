# Setup Utente Admin

## Creazione primo utente amministratore

Per creare il primo utente amministratore, eseguire il seguente comando dalla directory `apps/backend`:

```bash
npm run seed:admin
```

### Credenziali predefinite

- **Email**: `admin@studio.it`
- **Password**: `admin123`

⚠️ **IMPORTANTE**: Cambiare la password dopo il primo accesso!

## Come cambiare la password

1. Accedi con le credenziali predefinite
2. Vai alla pagina di gestione utenti (`/admin/users`)
3. Clicca sull'icona chiave (🔑) accanto al tuo utente
4. Inserisci la nuova password

## Creazione di altri utenti

Una volta effettuato l'accesso come admin, puoi creare altri utenti dalla dashboard di amministrazione:

1. Vai a `/admin/users`
2. Clicca su "Nuovo utente"
3. Compila il form con i dati richiesti
4. Seleziona il ruolo appropriato:
   - **Admin**: Accesso completo a tutte le funzionalità
   - **Avvocato**: Gestione pratiche e clienti
   - **Collaboratore**: Supporto operativo
   - **Segreteria**: Gestione amministrativa
   - **Cliente**: Accesso limitato alle proprie pratiche

## Risoluzione problemi

### Utente admin già esistente

Se lo script viene eseguito più volte, verrà mostrato un messaggio che indica che l'utente admin è già esistente. Le credenziali rimangono quelle predefinite a meno che non siano state modificate.

### Errore di connessione al database

Assicurati che:
1. Il database MySQL sia in esecuzione
2. Le credenziali nel file `.env` siano corrette
3. Il database `recupero_crediti` esista

### Errore durante la creazione

Se si verifica un errore, controlla i log per maggiori dettagli. I problemi più comuni sono:
- Database non raggiungibile
- Tabella `users` non creata (esegui le migrazioni)
- Permessi insufficienti sul database
