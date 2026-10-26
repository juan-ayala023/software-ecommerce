-- Ingenio OS · lanzamientos, configuración y métricas de Meta
-- Requiere 001_acceso_panel.sql. Pegar completo en Supabase → SQL Editor → Run. Se puede correr más de una vez.

-- 1. Lanzamientos: un producto recorriendo Análisis → … → Ventas
create sequence if not exists public.lanzamientos_codigo_seq start 32900;

create table if not exists public.lanzamientos (
  id text primary key default ('L' || nextval('public.lanzamientos_codigo_seq')),
  producto_id uuid references public.productos (id) on delete set null,
  producto_slug text,
  nombre text not null,
  nombre_shopify text,                 -- texto con el que aparece en pedidos.productos (para cruzar ventas)
  imagen_url text,
  etapa smallint not null default 0 check (etapa between 0 and 6),
  veredicto text check (veredicto in ('TESTEAR', 'VIGILAR', 'DESCARTAR')),
  costo integer,                       -- costo unitario del proveedor
  precios jsonb,                       -- [{qty, precio, antes, principal}]
  notas text,
  landing jsonb,
  anuncios jsonb,                      -- {AD1: {gancho, texto, titulo}, …}
  campana jsonb,                       -- {presupuesto, edadMin, edadMax, anuncios, meta_ids: [...]}
  creado_por text default (auth.jwt() ->> 'email'),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists lanzamientos_producto_idx on public.lanzamientos (producto_id);

-- 2. Configuración (una sola fila)
create table if not exists public.configuracion (
  id smallint primary key default 1 check (id = 1),
  marca text default 'Ingenio Store',
  dominio text default 'ingeniostore.co',
  whatsapp text,
  carpeta_drive text default '/Ingenio Store/Lanzamientos',
  flete integer not null default 14000,
  recaudo numeric not null default 0.03,
  tasa_entrega numeric not null default 0.72,
  actualizado_en timestamptz not null default now()
);
insert into public.configuracion (id) values (1) on conflict (id) do nothing;

-- 3. Métricas diarias de Meta Ads por campaña (las llena n8n; aquí va un histórico inicial)
create table if not exists public.metricas_meta (
  fecha date not null,
  campana_id text not null,
  campana_nombre text,
  gasto integer not null default 0,
  impresiones integer not null default 0,
  clics integer not null default 0,
  compras integer not null default 0,
  actualizado_en timestamptz not null default now(),
  primary key (fecha, campana_id)
);

-- 4. Permisos: panel (lista blanca) y n8n (service_role)
alter table public.lanzamientos enable row level security;
alter table public.configuracion enable row level security;
alter table public.metricas_meta enable row level security;

grant select, insert, update, delete on public.lanzamientos to authenticated;
grant usage, select on sequence public.lanzamientos_codigo_seq to authenticated;
grant select, update on public.configuracion to authenticated;
grant select on public.metricas_meta to authenticated;
grant all on public.lanzamientos, public.configuracion, public.metricas_meta to service_role;
grant usage, select on sequence public.lanzamientos_codigo_seq to service_role;

drop policy if exists panel_lanzamientos on public.lanzamientos;
create policy panel_lanzamientos on public.lanzamientos for all to authenticated
  using (public.es_del_panel()) with check (public.es_del_panel());

drop policy if exists panel_lee_config on public.configuracion;
create policy panel_lee_config on public.configuracion for select to authenticated using (public.es_del_panel());
drop policy if exists panel_edita_config on public.configuracion;
create policy panel_edita_config on public.configuracion for update to authenticated
  using (public.es_del_panel()) with check (public.es_del_panel());

drop policy if exists panel_lee_metricas on public.metricas_meta;
create policy panel_lee_metricas on public.metricas_meta for select to authenticated using (public.es_del_panel());

do $$
begin
  alter publication supabase_realtime add table public.lanzamientos;
exception when duplicate_object then null;
end $$;

-- 4b. Almacenamiento de creativos (imágenes y videos de Flow): carpeta por lanzamiento
insert into storage.buckets (id, name, public) values ('creativos', 'creativos', true)
on conflict (id) do nothing;

drop policy if exists panel_sube_creativos on storage.objects;
create policy panel_sube_creativos on storage.objects for insert to authenticated
  with check (bucket_id = 'creativos' and public.es_del_panel());
drop policy if exists panel_edita_creativos on storage.objects;
create policy panel_edita_creativos on storage.objects for update to authenticated
  using (bucket_id = 'creativos' and public.es_del_panel());
drop policy if exists panel_borra_creativos on storage.objects;
create policy panel_borra_creativos on storage.objects for delete to authenticated
  using (bucket_id = 'creativos' and public.es_del_panel());
drop policy if exists panel_lista_creativos on storage.objects;
create policy panel_lista_creativos on storage.objects for select to authenticated
  using (bucket_id = 'creativos' and public.es_del_panel());

-- 5. Histórico de Meta Ads (cuenta Ingenio Store -1, días con gasto, 26 sep – 25 oct 2026)
insert into public.metricas_meta (fecha, campana_id, campana_nombre, gasto, impresiones, clics, compras) values
  ('2026-10-19', '120255288523140045', 'Pelador | Videos | Test 6K', 2606, 60, 5, 0),
  ('2026-10-20', '120255288523140045', 'Pelador | Videos | Test 6K', 4857, 156, 9, 0),
  ('2026-10-21', '120255288523140045', 'Pelador | Videos | Test 6K', 29437, 572, 23, 1),
  ('2026-10-20', '120255292942780045', 'Calculadora | Videos | Test 6K', 5162, 235, 5, 0),
  ('2026-10-21', '120255310617600045', 'Calculadora | Videos | Test 6K - Copia', 7823, 280, 9, 0),
  ('2026-10-22', '120255310617600045', 'Calculadora | Videos | Test 6K - Copia', 8459, 296, 10, 0)
on conflict (fecha, campana_id) do update set
  gasto = excluded.gasto, impresiones = excluded.impresiones, clics = excluded.clics,
  compras = excluded.compras, campana_nombre = excluded.campana_nombre, actualizado_en = now();

-- 6. Lanzamientos que ya están corriendo (Pelador y Calculadora), enlazados a sus campañas
insert into public.lanzamientos (id, nombre, nombre_shopify, etapa, veredicto, campana)
select 'L32900', 'Pelador Eléctrico Recargable para Ajos y Frutas', 'Pelador Eléctrico', 6, 'TESTEAR',
       '{"meta_ids": ["120255288523140045", "120255287610720045"]}'::jsonb
where not exists (select 1 from public.lanzamientos where id = 'L32900');

insert into public.lanzamientos (id, nombre, nombre_shopify, etapa, veredicto, campana)
select 'L32901', 'Calculadora', 'Calculadora', 5, 'VIGILAR',
       '{"meta_ids": ["120255292942780045", "120255310617600045"]}'::jsonb
where not exists (select 1 from public.lanzamientos where id = 'L32901');

select setval('public.lanzamientos_codigo_seq', greatest(32902, (select coalesce(max(substr(id, 2)::int), 0) + 1 from public.lanzamientos where id ~ '^L[0-9]+$')), false);
