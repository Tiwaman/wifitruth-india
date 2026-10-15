import type { Stay } from "../types";

// Sample stays with approximate coordinates; for local dev and demos only.
const rows: [string, Stay["kind"], string, string, number, number][] = [
  ["Zostel Kasol", "hostel", "Kasol", "Himachal Pradesh", 32.0101, 77.3153],
  ["Parvati Riverside Homestay", "homestay", "Kasol", "Himachal Pradesh", 32.0125, 77.3139],
  ["Zostel Manali", "hostel", "Manali", "Himachal Pradesh", 32.2432, 77.1892],
  ["Old Manali Cafe Stay", "guesthouse", "Manali", "Himachal Pradesh", 32.2527, 77.1773],
  ["Zostel Rishikesh", "hostel", "Rishikesh", "Uttarakhand", 30.1264, 78.3225],
  ["Laxman Jhula Riverside Resort", "resort", "Rishikesh", "Uttarakhand", 30.1273, 78.3293],
  ["Zostel Goa Vagator", "hostel", "Vagator", "Goa", 15.6003, 73.7359],
  ["Anjuna Beach Guesthouse", "guesthouse", "Anjuna", "Goa", 15.5736, 73.7414],
  ["Palolem Beach Huts", "homestay", "Palolem", "Goa", 15.01, 74.0232],
  ["Zostel Bangalore", "hostel", "Bengaluru", "Karnataka", 12.9784, 77.6408],
  ["Indiranagar Business Hotel", "hotel", "Bengaluru", "Karnataka", 12.9719, 77.6412],
  ["Jaipur Haveli Stay", "hotel", "Jaipur", "Rajasthan", 26.9239, 75.8267],
  ["Udaipur Lakeview Hostel", "hostel", "Udaipur", "Rajasthan", 24.5764, 73.6803],
  ["Fort Kochi Heritage Homestay", "homestay", "Kochi", "Kerala", 9.9658, 76.2421],
  ["Varkala Cliff Resort", "resort", "Varkala", "Kerala", 8.7339, 76.7035],
];

export const SEED_STAYS: Stay[] = rows.map(([name, kind, city, state, lat, lon], i) => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  name,
  kind,
  city,
  state,
  lat,
  lon,
  osmType: null,
  osmId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
}));
