-- Sample stays (approximate coordinates). Run after migrations.
insert into public.stays (id, name, kind, city, state, lat, lon) values
  ('00000000-0000-4000-8000-000000000001', 'Zostel Kasol', 'hostel', 'Kasol', 'Himachal Pradesh', 32.0101, 77.3153),
  ('00000000-0000-4000-8000-000000000002', 'Parvati Riverside Homestay', 'homestay', 'Kasol', 'Himachal Pradesh', 32.0125, 77.3139),
  ('00000000-0000-4000-8000-000000000003', 'Zostel Manali', 'hostel', 'Manali', 'Himachal Pradesh', 32.2432, 77.1892),
  ('00000000-0000-4000-8000-000000000004', 'Old Manali Cafe Stay', 'guesthouse', 'Manali', 'Himachal Pradesh', 32.2527, 77.1773),
  ('00000000-0000-4000-8000-000000000005', 'Zostel Rishikesh', 'hostel', 'Rishikesh', 'Uttarakhand', 30.1264, 78.3225),
  ('00000000-0000-4000-8000-000000000006', 'Laxman Jhula Riverside Resort', 'resort', 'Rishikesh', 'Uttarakhand', 30.1273, 78.3293),
  ('00000000-0000-4000-8000-000000000007', 'Zostel Goa Vagator', 'hostel', 'Vagator', 'Goa', 15.6003, 73.7359),
  ('00000000-0000-4000-8000-000000000008', 'Anjuna Beach Guesthouse', 'guesthouse', 'Anjuna', 'Goa', 15.5736, 73.7414),
  ('00000000-0000-4000-8000-000000000009', 'Palolem Beach Huts', 'homestay', 'Palolem', 'Goa', 15.01, 74.0232),
  ('00000000-0000-4000-8000-000000000010', 'Zostel Bangalore', 'hostel', 'Bengaluru', 'Karnataka', 12.9784, 77.6408),
  ('00000000-0000-4000-8000-000000000011', 'Indiranagar Business Hotel', 'hotel', 'Bengaluru', 'Karnataka', 12.9719, 77.6412),
  ('00000000-0000-4000-8000-000000000012', 'Jaipur Haveli Stay', 'hotel', 'Jaipur', 'Rajasthan', 26.9239, 75.8267),
  ('00000000-0000-4000-8000-000000000013', 'Udaipur Lakeview Hostel', 'hostel', 'Udaipur', 'Rajasthan', 24.5764, 73.6803),
  ('00000000-0000-4000-8000-000000000014', 'Fort Kochi Heritage Homestay', 'homestay', 'Kochi', 'Kerala', 9.9658, 76.2421),
  ('00000000-0000-4000-8000-000000000015', 'Varkala Cliff Resort', 'resort', 'Varkala', 'Kerala', 8.7339, 76.7035)
on conflict (id) do nothing;
