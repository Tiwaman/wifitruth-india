export const STAY_KINDS = ["hostel", "hotel", "homestay", "resort", "guesthouse", "other"] as const;
export type StayKind = (typeof STAY_KINDS)[number];

export const SPOTS = ["reception", "room", "dorm", "rooftop", "common_area", "other"] as const;
export type Spot = (typeof SPOTS)[number];

export interface Stay {
  id: string;
  name: string;
  kind: StayKind;
  city: string;
  state: string;
  lat: number;
  lon: number;
  osmType: string | null;
  osmId: number | null;
  createdAt: string;
}

export interface NewStay {
  name: string;
  kind: StayKind;
  city: string;
  state: string;
  lat: number;
  lon: number;
  osmType?: string | null;
  osmId?: number | null;
}

export interface NewReading {
  stayId: string;
  spot: Spot;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  jitterMs: number;
  packetLoss: number;
  deviceHash: string;
  ipHash: string;
  distanceM: number;
  readingDay: string;
}

export interface Reading extends NewReading {
  id: string;
  createdAt: string;
}

export interface StayAggregate {
  stayId: string;
  readingCount: number;
  medianDownloadMbps: number | null;
  medianUploadMbps: number | null;
  medianLatencyMs: number | null;
  lastReadingAt: string | null;
}
