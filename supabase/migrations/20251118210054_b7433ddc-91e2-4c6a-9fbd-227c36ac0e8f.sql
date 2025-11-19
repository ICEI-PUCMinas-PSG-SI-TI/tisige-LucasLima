-- Remove the insecure public insert policy
DROP POLICY IF EXISTS "Public can insert consent" ON public.consent_log;

-- Create a secure policy that only allows service role to insert
CREATE POLICY "Service role can insert consent"
ON public.consent_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Add an index for better performance on table_id lookups
CREATE INDEX IF NOT EXISTS idx_consent_log_table_id ON public.consent_log(table_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_created_at ON public.consent_log(created_at DESC);