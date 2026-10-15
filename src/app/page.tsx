import { StaySearch } from "@/components/StaySearch";

export default function Home() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">WiFiTruth India</h1>
        <p className="text-slate-600">Real WiFi speeds at stays across India, measured by travellers.</p>
      </header>
      <StaySearch />
    </div>
  );
}
