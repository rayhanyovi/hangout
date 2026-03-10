export const TRANSPORT_MODES = ["walk", "motor", "car", "transit"] as const;
export const ROLES = ["host", "member"] as const;
export const PRIVACY_MODES = ["exact", "approximate"] as const;
export const LOCATION_SOURCES = ["gps", "pinned", "search"] as const;
export const VENUE_CATEGORIES = [
  "cafe",
  "restaurant",
  "park",
  "mall",
  "other",
] as const;
export const BUDGET_LEVELS = ["low", "mid", "high"] as const;
export const ROOM_STATUSES = ["open", "finalized", "expired"] as const;

export type TransportMode = (typeof TRANSPORT_MODES)[number];
export type Role = (typeof ROLES)[number];
export type PrivacyMode = (typeof PRIVACY_MODES)[number];
export type LocationSource = (typeof LOCATION_SOURCES)[number];
export type VenueCategory = (typeof VENUE_CATEGORIES)[number];
export type BudgetLevel = (typeof BUDGET_LEVELS)[number];
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export type RoomId = string;
export type MemberId = string;
export type VenueId = string;
export type VoteId = string;
export type JoinCode = string;

export type Coordinate = {
  lat: number;
  lng: number;
};

export type MemberLocation = Coordinate & {
  source: LocationSource;
  accuracyM?: number;
  updatedAt: string;
};

export type Member = {
  memberId: MemberId;
  roomId: RoomId;
  displayName: string;
  role: Role;
  joinedAt: string;
  lastActiveAt: string;
  location: MemberLocation | null;
};

export type FairnessItem = {
  memberId: MemberId;
  distanceKm?: number;
};

export type Midpoint = Coordinate & {
  method: "centroid" | "geometric_median";
  computedAt: string;
  fairness: FairnessItem[];
};

export type VenuePreferences = {
  categories: VenueCategory[];
  tags: string[];
  budget?: BudgetLevel;
  radiusMDefault: number;
};

export type Venue = Coordinate & {
  venueId: VenueId;
  providerId: string | null;
  name: string;
  category: VenueCategory;
  address: string | null;
  rating?: number;
  priceLevel?: number;
  openNow?: boolean;
  distanceToCenterM: number;
  tags: string[];
  mapUrl: string;
};

export type Vote = {
  voteId: VoteId;
  roomId: RoomId;
  memberId: MemberId;
  venueId: VenueId;
  reaction?: string;
  comment?: string;
  updatedAt: string;
};

export type FinalizedDecision = {
  roomId: RoomId;
  venueId: VenueId;
  finalizedByMemberId: MemberId;
  finalizedAt: string;
  shareUrl: string;
};

export type Room = {
  roomId: RoomId;
  joinCode: JoinCode;
  title: string | null;
  description: string | null;
  scheduledLabel: string | null;
  createdAt: string;
  expiresAt: string;
  createdByMemberId: MemberId;
  transportMode: TransportMode;
  privacyMode: PrivacyMode;
  venuePreferences: VenuePreferences;
  midpoint: Midpoint | null;
  finalizedDecision: FinalizedDecision | null;
  status: RoomStatus;
};

export type RoomSnapshot = {
  room: Room;
  members: Member[];
  venues: Venue[];
  votes: Vote[];
};
