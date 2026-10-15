import { notFound } from "next/navigation";
import Link from "next/link";
import { getStore } from "@/lib/data";
import { LocationCheck } from "@/components/LocationCheck";

export const dynamic = "force-dynamic";

export default async function StayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stay = await getStore().getStay(id);
  if (!stay) notFound();
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-blue-700 underline">
        Back to search
      </Link>
      <h1 className="text-2xl font-bold">{stay.name}</h1>
      <p className="text-slate-600">
        {stay.city}, {stay.state}
      </p>
      <LocationCheck stay={{ name: stay.name, lat: stay.lat, lon: stay.lon }} />
    </div>
  );
}
