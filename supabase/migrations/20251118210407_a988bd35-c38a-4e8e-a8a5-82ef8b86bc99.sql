-- Drop the existing policy that allows all admins to view all consent logs
DROP POLICY IF EXISTS "Admins can view consent logs" ON public.consent_log;

-- Create a new policy that restricts admins to view only consent logs from their own unit
CREATE POLICY "Admins can view unit consent logs"
ON public.consent_log
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM tables t
    JOIN profiles waiter_profile ON waiter_profile.id = t.waiter_id
    JOIN profiles admin_profile ON admin_profile.id = auth.uid()
    WHERE t.id = consent_log.table_id
    AND waiter_profile.unit_id = admin_profile.unit_id
    AND waiter_profile.unit_id IS NOT NULL
    AND admin_profile.unit_id IS NOT NULL
  )
);