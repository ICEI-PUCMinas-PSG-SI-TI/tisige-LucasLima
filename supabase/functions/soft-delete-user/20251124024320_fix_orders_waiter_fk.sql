-- OBJETIVO: Corrigir a Foreign Key (FK) da coluna 'waiter_id' na tabela 'orders'.
-- PROBLEMA: A FK apontava para 'auth.users(id)', o que impedia o PostgREST de
--           resolver a relação com a tabela 'profiles' para buscar o nome do garçom.
-- SOLUÇÃO:  Redirecionar a FK para apontar para 'public.profiles(id)'.

-- 1. Remove a constraint antiga que aponta para auth.users.
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_waiter_id_fkey;

-- 2. Cria a nova constraint apontando para a tabela de perfis.
ALTER TABLE public.orders
ADD CONSTRAINT orders_waiter_id_fkey
FOREIGN KEY (waiter_id) REFERENCES public.profiles(id);