-- Atualizar política RLS para admins visualizarem todos os orders
DROP POLICY IF EXISTS "Admins can view unit orders" ON public.orders;

CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);