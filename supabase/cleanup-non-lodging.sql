-- Cleanup of stays that are not lodging or are test junk.
-- Safe to run repeatedly: Part 1 only SELECTs. Part 2 (DELETE) is commented out.
-- Run in the Supabase SQL Editor. Review Part 1 output by eye before deleting anything.
--
-- Never touched: the 15 seed stays (ids 00000000-0000-4000-8000-0000000000NN).
-- Deleting a stay also deletes its readings (readings.stay_id is "on delete cascade").
-- Conservative on purpose: when unsure, a row is NOT listed. Look through the full stays list too.

-- Part 1: candidates (read only) ---------------------------------------------------------------
-- reason values:
--   e2e_test_name      name starts with "E2E" (automated test leftovers)
--   html_or_script     name or city contains "<", ">" or the word "script" (injection test junk)
--   place_not_lodging  kind is 'other', no OSM reference, and the name is just the city/locality
--                      (e.g. a town or neighbourhood saved as a "stay")
-- camp sites and huts imported from OSM have kind 'other' WITH an OSM reference, so they are kept.
with candidates as (
  select
    s.id,
    s.name,
    s.kind,
    s.city,
    s.state,
    s.osm_type,
    s.osm_id,
    s.created_at,
    (select count(*) from public.readings r where r.stay_id = s.id) as readings_count,
    case
      when s.name ~* '^\s*e2e' then 'e2e_test_name'
      when s.name ~* '[<>]' or s.name ~* 'script' or s.city ~* '[<>]' or s.city ~* 'script' then 'html_or_script'
      when s.kind = 'other'
           and s.osm_id is null
           and lower(btrim(s.name)) in (lower(btrim(s.city)), lower(btrim(s.state)))
        then 'place_not_lodging'
    end as reason
  from public.stays s
  where s.id::text !~ '^00000000-0000-4000-8000-0000000000[0-9][0-9]$'
)
select *
from candidates
where reason is not null
order by reason, created_at desc;

-- Part 2: delete (commented out) --------------------------------------------------------------
-- How to use:
--   1. Run Part 1 and read every row. Note the ids you want gone.
--   2. Safest: delete by explicit id. Replace the example ids with yours, remove the leading "-- "
--      from the three lines, and run them.
--   3. Faster but broader: delete every row Part 1 lists. Only do this if you checked all of them.
--      Remove the "-- " prefix from that block instead of the explicit-id one.
--   4. Re-run Part 1: it should now return no rows (or only rows you chose to keep).
-- There is no undo. Consider Supabase "Database > Backups" or a table export first.
--
-- Option A: by explicit id
-- delete from public.stays
-- where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')
--   and id::text !~ '^00000000-0000-4000-8000-0000000000[0-9][0-9]$';
--
-- Option B: everything Part 1 lists
-- delete from public.stays s
-- where s.id::text !~ '^00000000-0000-4000-8000-0000000000[0-9][0-9]$'
--   and (
--     s.name ~* '^\s*e2e'
--     or s.name ~* '[<>]' or s.name ~* 'script' or s.city ~* '[<>]' or s.city ~* 'script'
--     or (s.kind = 'other' and s.osm_id is null
--         and lower(btrim(s.name)) in (lower(btrim(s.city)), lower(btrim(s.state))))
--   );
