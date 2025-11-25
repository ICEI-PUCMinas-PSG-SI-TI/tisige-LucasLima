-- Remove any existing foreign key constraint to avoid conflicts
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_waiter_id_fkey;

-- Add the correct foreign key constraint pointing to profiles table
ALTER TABLE public.tables
ADD CONSTRAINT tables_waiter_id_fkey
FOREIGN KEY (waiter_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;