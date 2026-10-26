-- Ingenio OS · acceso del panel web
-- Pegar completo en Supabase → SQL Editor → Run. Se puede correr más de una vez.
--
-- n8n usa la llave service_role, que salta RLS: sus flujos no se ven afectados.
-- El panel entra con la llave pública + login. Solo los correos de panel_usuarios
-- pueden leer o modificar datos, aunque alguien más se registre.

-- 1. Lista blanca de usuarios del panel
create table if not exists public.panel_usuarios (
  email text primary key,
  creado_en timestamptz not null default now()
);
alter table public.panel_usuarios enable row level security;
-- n8n (service_role) valida la lista blanca del webhook del panel
grant select on public.panel_usuarios to service_role;

create or replace function public.es_del_panel()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.panel_usuarios
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;
revoke all on function public.es_del_panel() from public, anon;
grant execute on function public.es_del_panel() to authenticated;

-- 2. RLS en las tablas que usa el panel
alter table public.pedidos enable row level security;
alter table public.mensajes_whatsapp enable row level security;
alter table public.productos enable row level security;
alter table public.anuncios enable row level security;

-- 3. Permisos de tabla (solo columnas que el panel necesita escribir)
grant select on public.pedidos, public.mensajes_whatsapp, public.productos, public.anuncios to authenticated;
grant update (estado, guia, transportadora, despachado_en, direccion_corregida, actualizado_en) on public.pedidos to authenticated;
grant update (estado, updated_at) on public.productos to authenticated;

-- 4. Políticas
drop policy if exists panel_lee_pedidos on public.pedidos;
create policy panel_lee_pedidos on public.pedidos for select to authenticated using (public.es_del_panel());
drop policy if exists panel_edita_pedidos on public.pedidos;
create policy panel_edita_pedidos on public.pedidos for update to authenticated using (public.es_del_panel()) with check (public.es_del_panel());

drop policy if exists panel_lee_mensajes on public.mensajes_whatsapp;
create policy panel_lee_mensajes on public.mensajes_whatsapp for select to authenticated using (public.es_del_panel());

drop policy if exists panel_lee_productos on public.productos;
create policy panel_lee_productos on public.productos for select to authenticated using (public.es_del_panel());
drop policy if exists panel_edita_productos on public.productos;
create policy panel_edita_productos on public.productos for update to authenticated using (public.es_del_panel()) with check (public.es_del_panel());

drop policy if exists panel_lee_anuncios on public.anuncios;
create policy panel_lee_anuncios on public.anuncios for select to authenticated using (public.es_del_panel());

-- 5. Tiempo real para pedidos y mensajes
do $$
begin
  alter publication supabase_realtime add table public.pedidos;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.mensajes_whatsapp;
exception when duplicate_object then null;
end $$;

-- 6. Usuarios autorizados (cambia o agrega correos)
insert into public.panel_usuarios (email) values ('raplome7@gmail.com'), ('ayalajuanjose93@gmail.com')
on conflict (email) do nothing;
