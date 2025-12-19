-- Script per assegnare lo studio "Iorlano&Partners" a tutti i record esistenti
-- Eseguire questo script dopo aver verificato l'ID dello studio

-- PASSO 1: Trova l'ID dello studio Iorlano&Partners
-- Esegui prima questa query per trovare l'ID:
-- SELECT id, nome FROM studi WHERE nome LIKE '%Iorlano%' OR nome LIKE '%Partners%';

-- PASSO 2: Sostituisci 'STUDIO_ID_QUI' con l'ID reale trovato al passo 1
-- Esempio: SET @studio_id = '123e4567-e89b-12d3-a456-426614174000';

SET @studio_id = (SELECT id FROM studi WHERE nome LIKE '%Iorlano%' OR nome LIKE '%Partners%' LIMIT 1);

SELECT CONCAT('Studio trovato con ID: ', @studio_id) AS verifica;


UPDATE clienti
SET studioId = @studio_id
WHERE studioId IS NULL;

SELECT CONCAT('Aggiornati ', ROW_COUNT(), ' record in clienti') AS risultato;

UPDATE debitori
SET studioId = @studio_id
WHERE studioId IS NULL;

SELECT CONCAT('Aggiornati ', ROW_COUNT(), ' record in debitori') AS risultato;

UPDATE pratiche
SET studioId = @studio_id
WHERE studioId IS NULL;

SELECT CONCAT('Aggiornati ', ROW_COUNT(), ' record in pratiche') AS risultato;

UPDATE avvocati
SET studioId = @studio_id
WHERE studioId IS NULL;

SELECT CONCAT('Aggiornati ', ROW_COUNT(), ' record in avvocati') AS risultato;

UPDATE movimenti_finanziari
SET studioId = @studio_id
WHERE studioId IS NULL;

SELECT CONCAT('Aggiornati ', ROW_COUNT(), ' record in movimenti_finanziari') AS risultato;

UPDATE alerts
SET studioId = @studio_id
WHERE studioId IS NULL;

SELECT CONCAT('Aggiornati ', ROW_COUNT(), ' record in alerts') AS risultato;

UPDATE tickets
SET studioId = @studio_id
WHERE studioId IS NULL;

SELECT CONCAT('Aggiornati ', ROW_COUNT(), ' record in tickets') AS risultato;

UPDATE documenti
SET studioId = @studio_id
WHERE studioId IS NULL;

SELECT CONCAT('Aggiornati ', ROW_COUNT(), ' record in documenti') AS risultato;

UPDATE cartelle
SET studioId = @studio_id
WHERE studioId IS NULL;

SELECT CONCAT('Aggiornati ', ROW_COUNT(), ' record in cartelle') AS risultato;

UPDATE users
SET studioId = @studio_id
WHERE studioId IS NULL AND ruolo != 'admin';

SELECT CONCAT('Aggiornati ', ROW_COUNT(), ' record in users') AS risultato;

SELECT
    'clienti' AS tabella, COUNT(*) AS totale_con_studio
    FROM clienti WHERE studioId IS NOT NULL
UNION ALL
SELECT
    'debitori', COUNT(*)
    FROM debitori WHERE studioId IS NOT NULL
UNION ALL
SELECT
    'pratiche', COUNT(*)
    FROM pratiche WHERE studioId IS NOT NULL
UNION ALL
SELECT
    'avvocati', COUNT(*)
    FROM avvocati WHERE studioId IS NOT NULL
UNION ALL
SELECT
    'movimenti_finanziari', COUNT(*)
    FROM movimenti_finanziari WHERE studioId IS NOT NULL
UNION ALL
SELECT
    'alerts', COUNT(*)
    FROM alerts WHERE studioId IS NOT NULL
UNION ALL
SELECT
    'tickets', COUNT(*)
    FROM tickets WHERE studioId IS NOT NULL
UNION ALL
SELECT
    'documenti', COUNT(*)
    FROM documenti WHERE studioId IS NOT NULL
UNION ALL
SELECT
    'cartelle', COUNT(*)
    FROM cartelle WHERE studioId IS NOT NULL
UNION ALL
SELECT
    'users', COUNT(*)
    FROM users WHERE studioId IS NOT NULL;
