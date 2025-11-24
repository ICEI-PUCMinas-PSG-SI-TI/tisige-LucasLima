-- Habilita RLS nas tabelas se ainda não estiverem ativas.
-- Se já estiverem ativas, estes comandos não farão nada.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas que podem conflitar, se existirem.
-- A política "Users can view active profiles" é muito permissiva e será substituída.
-- A política "Users can view own roles" será coberta pela nova política de admin.
DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- POLÍTICA PARA A TABELA 'profiles'
-- Permite que administradores visualizem todos os perfis.
-- Usuários não-admins podem visualizar apenas o próprio perfil.
CREATE POLICY "Usuários podem ver perfis (próprio ou todos se admin)"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR (public.has_role(auth.uid(), 'admin'))
);

-- POLÍTICA PARA A TABELA 'user_roles'
-- Permite que administradores visualizem todas as funções.
-- Usuários não-admins podem visualizar apenas as próprias funções.
CREATE POLICY "Usuários podem ver roles (próprias ou todas se admin)"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR (public.has_role(auth.uid(), 'admin'))
);

-- POLÍTICA PARA A TABELA 'auth.users'
-- Permite que administradores leiam todos os usuários da tabela de autenticação.
CREATE POLICY "Admins podem visualizar todos os usuários"
ON auth.users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
