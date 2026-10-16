import { BedIcon, BellIcon, BunkIcon, DotsIcon, GuesthouseIcon, HomestayIcon, HostelIcon, HotelIcon, ResortIcon, SofaIcon, SunIcon, TentIcon } from "@/components/icons";
import type { Spot, StayKind } from "@/lib/types";

const SPOT: Record<Spot, typeof BedIcon> = {
  reception: BellIcon,
  room: BedIcon,
  dorm: BunkIcon,
  rooftop: SunIcon,
  common_area: SofaIcon,
  other: DotsIcon,
};

const KIND: Record<StayKind, typeof HotelIcon> = {
  hotel: HotelIcon,
  hostel: HostelIcon,
  guesthouse: GuesthouseIcon,
  homestay: HomestayIcon,
  resort: ResortIcon,
  other: TentIcon,
};

export function SpotIcon({ spot, className = "h-5 w-5" }: { spot: Spot; className?: string }) {
  const Icon = SPOT[spot];
  return <Icon className={className} />;
}

export function KindIcon({ kind, className = "h-5 w-5" }: { kind: StayKind; className?: string }) {
  const Icon = KIND[kind];
  return <Icon className={className} />;
}
