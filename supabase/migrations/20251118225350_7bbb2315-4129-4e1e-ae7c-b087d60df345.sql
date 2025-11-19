-- Drop the existing restrictive policy for viewing units
DROP POLICY IF EXISTS "Authenticated users can view units" ON public.units;

-- Create a new policy that allows anyone to view units (read-only for setup)
CREATE POLICY "Anyone can view units"
ON public.units
FOR SELECT
USING (true);

-- Keep the admin-only policy for managing (insert, update, delete) units
-- This policy already exists and doesn't need changes