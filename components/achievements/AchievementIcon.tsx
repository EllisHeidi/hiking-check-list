import {
  ArrowUp,
  Award,
  Flag,
  Footprints,
  Map,
  Mountain,
  MountainSnow,
  Route,
  Sunrise,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

// Achievement rows store a Lucide icon name; map the ones we seed.
const ICONS: Record<string, LucideIcon> = {
  mountain: Mountain,
  "mountain-snow": MountainSnow,
  footprints: Footprints,
  route: Route,
  "trending-up": TrendingUp,
  "arrow-up": ArrowUp,
  sunrise: Sunrise,
  map: Map,
  flag: Flag,
};

export function AchievementIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || Award;
  return <Icon className={className} aria-hidden />;
}
