// Deterministic stand-in for Photon and Nominatim so e2e never touches the network.
// Photon: /photon/api/?q=...  Nominatim: /nominatim/search?q=...
// Results always mix lodging with non-lodging so the app's filtering is exercised.
// A query containing "photonfail" makes Photon answer 500 so the Nominatim fallback runs.
import http from "node:http";

const PORT = 3101;

function seed(q) {
  let h = 7;
  for (const c of q) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return { id: 900000 + h, lat: 20 + (h % 1000) / 200, lon: 76 + (Math.floor(h / 7) % 1000) / 200 };
}

function photon(q) {
  const { id, lat, lon } = seed(q);
  const f = (name, osm_key, osm_value, n) => ({
    geometry: { coordinates: [lon + n * 0.01, lat] },
    properties: { name, osm_key, osm_value, osm_type: "N", osm_id: id + n, countrycode: "IN", city: "Teststown", state: "Goa" },
  });
  return {
    features: [
      f(`${q} Hotel`, "tourism", "hotel", 1),
      f(`${q} Cafe`, "amenity", "cafe", 2),
      f(`${q} City`, "place", "city", 3),
      f(`${q} Fort`, "tourism", "attraction", 4),
      f(`${q} Bakery`, "shop", "bakery", 5),
    ],
  };
}

function nominatim(q) {
  const { id, lat, lon } = seed(q);
  const f = (name, category, type, n) => ({
    lat: String(lat), lon: String(lon + n * 0.01), name, category, type, osm_type: "way", osm_id: id + n,
    address: { country_code: "in", state: "Goa", town: "Teststown" },
  });
  return [f(`${q} Guest House`, "tourism", "guest_house", 1), f(`${q} Museum`, "tourism", "museum", 2), f(`${q} Station`, "railway", "station", 3)];
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const q = url.searchParams.get("q") ?? "";
    const send = (code, body) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (url.pathname === "/") return send(200, { ok: true });
    if (url.pathname.startsWith("/photon/")) return q.includes("photonfail") ? send(500, { error: "down" }) : send(200, photon(q));
    if (url.pathname.startsWith("/nominatim/")) return send(200, nominatim(q));
    send(404, {});
  })
  .listen(PORT, "127.0.0.1");
