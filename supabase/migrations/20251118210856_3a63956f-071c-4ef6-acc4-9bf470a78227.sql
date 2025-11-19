-- Create table for bill access tokens
CREATE TABLE public.bill_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create index for fast token lookups
CREATE INDEX idx_bill_tokens_token ON public.bill_tokens(token);
CREATE INDEX idx_bill_tokens_expires_at ON public.bill_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.bill_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can manage tokens (edge functions)
CREATE POLICY "Service role can manage bill tokens"
ON public.bill_tokens
FOR ALL
USING (true);

-- Function to clean up expired tokens (called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_bill_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.bill_tokens
  WHERE expires_at < now();
END;
$$;