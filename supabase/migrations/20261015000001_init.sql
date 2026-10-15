-- WiFiTruth India: initial schema

create extension if not exists pgcrypto;

create type public.stay_kind as enum ('hostel', 'hotel', 'homestay', 'resort', 'guesthouse', 'other');
create type public.spot as enum ('reception', 'room', 'dorm', 'rooftop', 'common_area', 'other');

create table public.stays (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  kind public.stay_kind not null default 'other',
  city text not null check (char_length(city) between 1 and 80),
  state text not null check (char_length(state) between 1 and 80),
  lat double precision not null check (lat between 6.7 and 35.7),
  lon double precision not null check (lon between 68.1 and 97.4),
  osm_type text check (osm_type in ('N', 'W', 'R')),
  osm_id bigint check (osm_id > 0),
  created_at timestamptz not null default now(),
  -- reserved for deferred owner verification (no UI in v1)
  claimed_by text,
  claimed_at timestamptz,
  claimed_contact text,
  constraint stays_osm_pair check ((osm_type is null) = (osm_id is null))
);

create unique index stays_osm_unique on public.stays (osm_type, osm_id) where osm_id is not null;
create index stays_name_idx on public.stays (lower(name));
create index stays_city_idx on public.stays (lower(city));

create table public.readings (
  id uuid primary key default gen_random_uuid(),
  stay_id uuid not null references public.stays (id) on delete cascade,
  spot public.spot not null,
  download_mbps numeric not null check (download_mbps >= 0 and download_mbps <= 10000),
  upload_mbps numeric not null check (upload_mbps >= 0 and upload_mbps <= 10000),
  latency_ms numeric not null check (latency_ms >= 0 and latency_ms <= 60000),
  jitter_ms numeric not null check (jitter_ms >= 0 and jitter_ms <= 60000),
  packet_loss numeric not null check (packet_loss >= 0 and packet_loss <= 100),
  device_hash text not null,
  ip_hash text not null,
  distance_m integer not null check (distance_m >= 0 and distance_m <= 150),
  reading_day date not null default (now() at time zone 'Asia/Kolkata')::date,
  created_at timestamptz not null default now(),
  unique (stay_id, device_hash, reading_day)
);

create index readings_stay_idx on public.readings (stay_id, created_at desc);

-- RLS: public read of stays; readings are only exposed through the aggregate view.
-- Inserts happen server-side with the service role key, which bypasses RLS.
alter table public.stays enable row level security;
alter table public.readings enable row level security;

create policy "stays are publicly readable" on public.stays for select using (true);

-- Aggregates (median per stay). Recency weighting and bands are applied in app code (milestone 7).
-- security_invoker is off so anon can read aggregates without reading raw readings (hashes).
create view public.stay_aggregates with (security_invoker = false) as
select
  stay_id,
  count(*)::int as reading_count,
  percentile_cont(0.5) within group (order by download_mbps) as median_download_mbps,
  percentile_cont(0.5) within group (order by upload_mbps) as median_upload_mbps,
  percentile_cont(0.5) within group (order by latency_ms) as median_latency_ms,
  max(created_at) as last_reading_at
from public.readings
group by stay_id;

create view public.spot_aggregates with (security_invoker = false) as
select
  stay_id,
  spot,
  count(*)::int as reading_count,
  percentile_cont(0.5) within group (order by download_mbps) as median_download_mbps,
  percentile_cont(0.5) within group (order by upload_mbps) as median_upload_mbps,
  percentile_cont(0.5) within group (order by latency_ms) as median_latency_ms,
  max(created_at) as last_reading_at
from public.readings
group by stay_id, spot;

-- Supabase grants broad default privileges to anon/authenticated; strip them, then grant read-only access
-- to what the public API may see. Readings (device/IP hashes) are never readable by anon.
revoke all on public.stays, public.readings, public.stay_aggregates, public.spot_aggregates from anon, authenticated;
grant select on public.stays, public.stay_aggregates, public.spot_aggregates to anon, authenticated;
