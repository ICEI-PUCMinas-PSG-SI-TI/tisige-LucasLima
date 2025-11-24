-- Remover constraint antiga para evitar conflitos
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_waiter_id_fkey;

-- Criar nova constraint apontando explicitamente para profiles
ALTER TABLE public.orders
ADD CONSTRAINT orders_waiter_id_fkey
FOREIGN KEY (waiter_id)
REFERENCES public.profiles(id);