// TEMPORARY QA page — deleted after testing.
import { BackLink } from "@/components/ui/BackLink";
import { MountainImage } from "@/components/mountains/MountainImage";
import { onImageButtonClass } from "@/components/ui/styles";
export default function Page() {
  return (
    <section className="relative isolate h-80 overflow-hidden bg-ink text-stone-50">
      <MountainImage src="/mountains/leeukop.jpg" alt="Lion's Head" sizes="100vw" className="-z-10" priority />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/25 to-ink/30" />
      <div className="flex justify-between p-4">
        <BackLink fallback="/mountains" variant="onImage" />
        <span className={onImageButtonClass}>Edit mountain</span>
      </div>
    </section>
  );
}
