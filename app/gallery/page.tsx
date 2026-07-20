"use client";

import Link from "next/link";
import { useKadima } from "@/lib/store";
import { CATEGORIES } from "@/lib/constants";

export default function GalleryIndexPage() {
  const tasks = useKadima((s) => s.tasks);
  const attachments = useKadima((s) => s.attachments);

  const rows = CATEGORIES.map((category) => {
    const inCategory = tasks.filter((t) => t.category === category);
    const ids = new Set(inCategory.map((t) => t.id));
    const images = [
      ...inCategory.filter((t) => t.image_url).map((t) => t.image_url),
      ...attachments
        .filter((a) => ids.has(a.task_id) && a.mime_type.startsWith("image/"))
        .map((a) => a.url)
    ];
    return { category, count: inCategory.length, cover: images[0] ?? "", images: images.length };
  });

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-draft">גלריה לפי קטגוריה</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <Link
            key={r.category}
            href={"/gallery/" + encodeURIComponent(r.category)}
            className="card overflow-hidden hover:border-ink transition-colors"
          >
            <div className="h-36 bg-paper flex items-center justify-center">
              {r.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.cover} alt={r.category} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-draft">אין תמונות</span>
              )}
            </div>
            <div className="p-3">
              <div className="font-medium">{r.category}</div>
              <div className="text-xs text-draft mt-1">
                {r.count} רשומות · {r.images} תמונות
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
