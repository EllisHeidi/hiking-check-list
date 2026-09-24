import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getHike } from "@/lib/queries/hikes";
import { getHikeFormMountains } from "@/lib/queries/mountains";
import { Container, PageHeader } from "@/components/ui/Section";
import { HikeForm } from "@/components/hikes/HikeForm";

export const metadata: Metadata = { title: "Edit hike" };

export default async function EditHikePage({ params }: PageProps<"/hikes/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser(`/hikes/${id}/edit`);
  const [hike, mountains] = await Promise.all([getHike(id), getHikeFormMountains(user.id)]);
  // Only the owner can edit; RLS enforces this on write as well.
  if (!hike || hike.user_id !== user.id) notFound();

  return (
    <Container className="max-w-2xl pb-16">
      <PageHeader eyebrow={hike.mountain.name} title="Edit hike" back={`/hikes/${hike.id}`} />
      <HikeForm
        mountains={mountains}
        today={new Date().toISOString().slice(0, 10)}
        initial={{
          id: hike.id,
          mountainId: hike.mountain_id,
          date: hike.completion_date ?? new Date().toISOString().slice(0, 10),
          completed: hike.completed,
          distanceKm: hike.distance_km,
          elevationGainM: hike.elevation_gain_m,
          movingTimeMinutes: hike.moving_time_minutes,
          notes: hike.notes,
          photos: hike.photos,
        }}
      />
    </Container>
  );
}
