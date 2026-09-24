// Domain types mirroring the Supabase schema (supabase/migrations).
// Postgres numeric columns arrive as numbers or strings depending on the driver,
// so queries normalise them with toNumber() before they reach components.

export type Difficulty = "Easy" | "Moderate" | "Hard" | "Strenuous" | "Extreme" | string;

export interface Mountain {
  id: string;
  name: string;
  slug: string;
  elevation: number | null;
  region: string | null;
  country: string | null;
  difficulty: Difficulty | null;
  description: string | null;
  route_name: string | null;
  route_description: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  distance_km: number | null;
  elevation_gain_m: number | null;
  sort_order: number;
  is_final_goal: boolean;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  created_at: string;
}

export interface HikePhoto {
  id: string;
  hike_id: string;
  storage_path: string;
  caption: string | null;
  /** Short-lived signed URL, added server-side. */
  url?: string | null;
}

export interface Hike {
  id: string;
  user_id: string;
  mountain_id: string;
  completed: boolean;
  completion_date: string | null;
  distance_km: number | null;
  elevation_gain_m: number | null;
  moving_time_minutes: number | null;
  notes: string | null;
  created_at: string;
  mountain: Pick<
    Mountain,
    "id" | "name" | "slug" | "elevation" | "region" | "image_url" | "is_final_goal"
  >;
  photos: HikePhoto[];
}

export type RequirementType =
  | "mountains_completed"
  | "single_hike_km"
  | "total_distance_km"
  | "total_elevation_m"
  | "summit_elevation_m"
  | "final_goal";

export interface Achievement {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  requirement_type: RequirementType;
  requirement_value: number;
  sort_order: number;
}

export interface EarnedAchievement {
  achievement_id: string;
  earned_at: string;
}

export type ActivityType = "hike_completed" | "mountain_conquered" | "achievement_earned";

export interface ActivityItem {
  id: string;
  activity_type: ActivityType;
  created_at: string;
  user: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  hike: (Omit<Hike, "photos" | "user_id" | "mountain_id" | "created_at" | "notes"> & {
    photos: HikePhoto[];
  }) | null;
  achievement: Pick<Achievement, "id" | "name" | "slug" | "icon"> | null;
}

export interface ProfileCard {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_public: boolean;
  follower_count: number;
  following_count: number;
}

export interface UserStats {
  mountainsConquered: number;
  totalMountains: number;
  percentComplete: number;
  totalHikes: number;
  totalDistanceKm: number;
  totalElevationM: number;
  highestSummit: { name: string; elevation: number; slug: string } | null;
  longestHikeKm: number;
  averageDistanceKm: number;
  kilimanjaroMultiple: number;
  kilimanjaroElevation: number | null;
}
