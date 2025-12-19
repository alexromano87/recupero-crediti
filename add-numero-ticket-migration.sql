-- Migration: Add numeroTicket column to tickets table
-- Run this SQL script manually on your database

-- Step 1: Add numeroTicket column WITHOUT unique constraint initially
ALTER TABLE `tickets`
ADD COLUMN `numeroTicket` VARCHAR(36) NULL AFTER `id`;

-- Step 2: Update existing tickets with unique UUIDs
UPDATE `tickets`
SET `numeroTicket` = UUID()
WHERE `numeroTicket` IS NULL OR `numeroTicket` = '';

-- Step 3: Now make the column NOT NULL and UNIQUE
ALTER TABLE `tickets`
MODIFY COLUMN `numeroTicket` VARCHAR(36) NOT NULL;

ALTER TABLE `tickets`
ADD UNIQUE INDEX `IDX_tickets_numeroTicket` (`numeroTicket`);
