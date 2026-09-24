"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { reorderList } from "@/lib/actions/mountains";
import { stageForElevation } from "@/lib/stages";
import type { Mountain } from "@/types";
import { ManageListRow } from "./ManageListRow";

/** Drag-and-drop reordering of your kill list (mouse, touch and keyboard). */
export function SortableList({ mountains, conqueredIds }: { mountains: Mountain[]; conqueredIds: string[] }) {
  const [items, setItems] = useState(mountains);
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const router = useRouter();
  const conquered = new Set(conqueredIds);
  const nameOf = (id: string | number) => items.find((m) => m.id === id)?.name ?? "Mountain";
  const positionOf = (id: string | number) => items.findIndex((m) => m.id === id) + 1;

  const sensors = useSensors(
    // Small distance so a tap on the handle doesn't start a drag by accident.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const previous = items;
    const next = arrayMove(items, positionOf(active.id) - 1, positionOf(over.id) - 1);
    setItems(next);
    setError(null);
    start(async () => {
      const res = await reorderList(
        next.map((m) => ({ mountainId: m.id, stage: m.stage ?? stageForElevation(m.elevation) })),
      );
      if (!res.ok) {
        setItems(previous);
        setError(res.error);
      }
      router.refresh();
    });
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
            onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} is now at position ${positionOf(over.id)}.` : ""),
            onDragEnd: ({ active, over }) => (over ? `${nameOf(active.id)} dropped at position ${positionOf(over.id)}.` : ""),
            onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} cancelled.`,
          },
          screenReaderInstructions: {
            draggable: "To reorder, press space or enter to pick up, use the arrow keys to move, and press space or enter again to drop.",
          },
        }}
      >
        <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <ol className="border-b border-ink/10" aria-busy={saving}>
            {items.map((m, i) => (
              <SortableRow key={m.id} mountain={m} index={i + 1} conquered={conquered.has(m.id)} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <p className={`mt-2 h-5 text-sm ${error ? "text-ember-600" : "text-mist"}`} role={error ? "alert" : "status"}>
        {error ?? (saving ? "Saving order…" : "")}
      </p>
    </>
  );
}

function SortableRow({ mountain, index, conquered }: { mountain: Mountain; index: number; conquered: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: mountain.id,
  });

  return (
    <ManageListRow
      mountain={mountain}
      index={index}
      conquered={conquered}
      rowRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      dragging={isDragging}
      handle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${mountain.name}`}
          className={`inline-flex size-11 shrink-0 touch-none items-center justify-center rounded-sm text-mist transition-colors hover:bg-sand hover:text-ink ${
            isDragging ? "cursor-grabbing text-forest" : "cursor-grab"
          }`}
        >
          <GripVertical className="size-5" aria-hidden />
        </button>
      }
    />
  );
}
