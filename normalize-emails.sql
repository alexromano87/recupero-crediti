-- Script per normalizzare le email esistenti nel database
-- Converte tutte le email in lowercase e rimuove spazi

UPDATE users
SET email = LOWER(TRIM(email))
WHERE email != LOWER(TRIM(email));

SELECT id, email, nome, cognome, ruolo
FROM users
ORDER BY email;
