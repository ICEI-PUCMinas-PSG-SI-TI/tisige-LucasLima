-- Remover todas as políticas de SELECT existentes em profiles
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Remover todas as políticas de SELECT existentes em user_roles
DROP POLICY IF EXISTS "Authenticated users can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

-- Criar política de leitura totalmente aberta para profiles
CREATE POLICY "Leitura permitida para autenticados"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Criar política de leitura totalmente aberta para user_roles
CREATE POLICY "Leitura roles permitida para autenticados"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);