-- Remove the unique constraint on table_number
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_table_number_key;

-- Remove the unique index if it exists separately
DROP INDEX IF EXISTS tables_table_number_key;

-- Create a conditional unique index to allow duplicate table numbers only for closed tables
-- This ensures that only one active table (occupied, waiting_payment, or available) can have a specific number
CREATE UNIQUE INDEX unique_active_table_number 
ON public.tables (table_number) 
WHERE status IN ('occupied', 'waiting_payment', 'available');