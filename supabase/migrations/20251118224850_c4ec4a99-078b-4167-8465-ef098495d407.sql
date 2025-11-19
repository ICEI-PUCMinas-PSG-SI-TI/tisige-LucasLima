-- Add address field to units table
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS address text;

-- Insert the first unit (Matriz)
INSERT INTO public.units (name, address)
VALUES ('Matriz', 'Rua clara eliza, 4122 - Monte Alto - Bel horizonte')
ON CONFLICT DO NOTHING;

-- Create a function to setup the first admin user
CREATE OR REPLACE FUNCTION public.setup_first_admin(
  p_email text,
  p_password text,
  p_full_name text,
  p_unit_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_unit_id uuid;
  v_encrypted_password text;
BEGIN
  -- Get the unit ID
  SELECT id INTO v_unit_id
  FROM public.units
  WHERE name = p_unit_name
  LIMIT 1;

  IF v_unit_id IS NULL THEN
    RAISE EXCEPTION 'Unit not found';
  END IF;

  -- Generate a new UUID for the user
  v_user_id := gen_random_uuid();

  -- Encrypt the password using pgcrypto (crypt with bf algorithm)
  v_encrypted_password := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users (requires service role or superuser privileges)
  -- Note: This is a simplified version. In production, you'd use Supabase admin API
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_password,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    '',
    ''
  );

  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, unit_id)
  VALUES (v_user_id, p_full_name, v_unit_id);

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role, unit_id)
  VALUES (v_user_id, 'admin', v_unit_id);

  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'unit_id', v_unit_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Execute the function to create the first admin
SELECT public.setup_first_admin(
  'adm@teste.com',
  'SenhaForte1234',
  'Administrador',
  'Matriz'
);