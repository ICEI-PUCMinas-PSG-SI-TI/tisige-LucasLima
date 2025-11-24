-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Recriar função has_role como SECURITY DEFINER para evitar recursão
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Política simples em user_roles: todos autenticados podem ler
-- Isso quebra o ciclo de recursão
CREATE POLICY "Authenticated users can view user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Política em profiles: usuários veem próprio perfil OU são admin
CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);