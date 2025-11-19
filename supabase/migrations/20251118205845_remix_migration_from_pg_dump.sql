--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'waiter',
    'kitchen'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'preparing',
    'ready',
    'delivered'
);


--
-- Name: table_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.table_status AS ENUM (
    'available',
    'occupied',
    'closed',
    'waiting_payment'
);


--
-- Name: deduct_stock_for_order(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deduct_stock_for_order(order_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  order_record RECORD;
  recipe_item JSONB;
  insumo_id_val UUID;
  quantidade_val NUMERIC;
BEGIN
  -- Get order details
  SELECT o.quantity, m.recipe
  INTO order_record
  FROM orders o
  JOIN menu_items m ON m.id = o.menu_item_id
  WHERE o.id = order_id;

  -- Loop through each ingredient in the recipe
  FOR recipe_item IN SELECT * FROM jsonb_array_elements(order_record.recipe)
  LOOP
    insumo_id_val := (recipe_item->>'insumo_id')::UUID;
    quantidade_val := (recipe_item->>'quantidade')::NUMERIC;
    
    -- Deduct stock
    UPDATE insumos
    SET quantidade_atual = quantidade_atual - (quantidade_val * order_record.quantity)
    WHERE id = insumo_id_val;
  END LOOP;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_table_total(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_table_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE public.tables
  SET total_amount = (
    SELECT COALESCE(SUM(item_price * quantity), 0)
    FROM public.orders
    WHERE table_id = NEW.table_id
  )
  WHERE id = NEW.table_id;
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: consent_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consent_log (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    table_id uuid NOT NULL,
    phone text,
    consent_given boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: insumos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insumos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    unidade_de_medida text NOT NULL,
    quantidade_atual numeric DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menu_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    price numeric(10,2) NOT NULL,
    available boolean DEFAULT true,
    image_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    recipe jsonb DEFAULT '[]'::jsonb
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    table_id uuid NOT NULL,
    menu_item_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    observations text,
    status public.order_status DEFAULT 'pending'::public.order_status,
    waiter_id uuid NOT NULL,
    item_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    unit_id uuid
);


--
-- Name: tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tables (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    table_number integer NOT NULL,
    client_name text,
    status public.table_status DEFAULT 'available'::public.table_status,
    waiter_id uuid,
    opened_at timestamp with time zone,
    closed_at timestamp with time zone,
    total_amount numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    unit_id uuid
);


--
-- Name: consent_log consent_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_log
    ADD CONSTRAINT consent_log_pkey PRIMARY KEY (id);


--
-- Name: insumos insumos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- Name: tables tables_table_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_table_number_key UNIQUE (table_number);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_profiles_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_deleted_at ON public.profiles USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: orders on_order_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_order_insert AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_table_total();


--
-- Name: consent_log consent_log_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consent_log
    ADD CONSTRAINT consent_log_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id);


--
-- Name: orders orders_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);


--
-- Name: orders orders_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.tables(id) ON DELETE CASCADE;


--
-- Name: orders orders_waiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_waiter_id_fkey FOREIGN KEY (waiter_id) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: tables tables_waiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_waiter_id_fkey FOREIGN KEY (waiter_id) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: insumos Admins can manage insumos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage insumos" ON public.insumos USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: menu_items Admins can manage menu items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage menu items" ON public.menu_items USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: units Admins can manage units; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage units" ON public.units TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage user roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update any profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: menu_items Admins can view all menu items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all menu items" ON public.menu_items FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: consent_log Admins can view consent logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view consent logs" ON public.consent_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Admins can view unit orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view unit orders" ON public.orders FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM ((public.profiles p
     JOIN public.tables t ON ((t.id = orders.table_id)))
     JOIN public.profiles waiter ON ((waiter.id = t.waiter_id)))
  WHERE ((p.id = auth.uid()) AND (p.unit_id = waiter.unit_id))))));


--
-- Name: tables Authenticated users can view tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view tables" ON public.tables FOR SELECT TO authenticated USING (true);


--
-- Name: units Authenticated users can view units; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view units" ON public.units FOR SELECT TO authenticated USING (true);


--
-- Name: menu_items Everyone can view available menu items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view available menu items" ON public.menu_items FOR SELECT USING ((available = true));


--
-- Name: orders Kitchen and admins can update orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Kitchen and admins can update orders" ON public.orders FOR UPDATE USING ((public.has_role(auth.uid(), 'kitchen'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: insumos Kitchen and waiters can view insumos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Kitchen and waiters can view insumos" ON public.insumos FOR SELECT USING ((public.has_role(auth.uid(), 'kitchen'::public.app_role) OR public.has_role(auth.uid(), 'waiter'::public.app_role)));


--
-- Name: orders Kitchen can view unit orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Kitchen can view unit orders" ON public.orders FOR SELECT USING ((public.has_role(auth.uid(), 'kitchen'::public.app_role) AND (EXISTS ( SELECT 1
   FROM ((public.profiles p
     JOIN public.tables t ON ((t.id = orders.table_id)))
     JOIN public.profiles waiter ON ((waiter.id = t.waiter_id)))
  WHERE ((p.id = auth.uid()) AND (p.unit_id = waiter.unit_id))))));


--
-- Name: consent_log Public can insert consent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can insert consent" ON public.consent_log FOR INSERT WITH CHECK (true);


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can view active profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view active profiles" ON public.profiles FOR SELECT USING ((deleted_at IS NULL));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tables Waiters and admins can manage tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Waiters and admins can manage tables" ON public.tables USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'waiter'::public.app_role)));


--
-- Name: orders Waiters can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Waiters can create orders" ON public.orders FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'waiter'::public.app_role));


--
-- Name: orders Waiters can view own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Waiters can view own orders" ON public.orders FOR SELECT USING ((public.has_role(auth.uid(), 'waiter'::public.app_role) AND (waiter_id = auth.uid())));


--
-- Name: consent_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

--
-- Name: insumos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;

--
-- Name: menu_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

--
-- Name: units; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


