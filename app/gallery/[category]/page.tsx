"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useKadima, selectCategoryImages } from "@/lib/store";
import Badge from "@/components/Badge";
import { daysLeftLabel } from "@/lib/utils";

export default function CategoryGalleryPage() {
  const params = useParams<{ category: string }>();
  const category = decodeURIComponent(params.category);
  const images = useKadima(selectCategoryImages(category));
  const tasks = useKadima((s) => s.tasks.filter((t) => t.category === category));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/gallery" className="text-xs text-draft hover:text-ink">
          חזרה לגלריה
        </Link>
        <h2 className="text-xl font-semibold mt-1">{category}</h2>
        <p className="text-xs text-draft mt-1">
          {tasks.length} רשומות · {images.length} תמונות
        </p>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <figure key={img.url + i} className="space-y-1">
              <a href={img.url} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-40 object-cover rounded border border-line hover:border-ink transition-colors"
                />
              </a>
              <figcaption className="text-xs text-draft truncate">
                <Link href={"/task/" + img.taskId} className="hover:text-ink">
                  {img.taskName}
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="text-sm text-draft">אין תמונות בקטגוריה הזו עדיין.</div>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-draft">רשומות בקטגוריה</h3>
        {tasks.map((t) => (
          <div key={t.id} className="card p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48">
              <Link href={"/task/" + t.id} className="font-medium hover:text-accent">
                {t.name}
              </Link>
              <div className="text-xs text-draft mt-1">
                {t.department || "ללא מינהל"} · {daysLeftLabel(t.due_date)}
              </div>
            </div>
            <Badge status={t.status} />
          </div>
        ))}
        {tasks.length === 0 && <div className="text-sm text-draft">אין רשומות בקטגוריה הזו.</div>}
      </section>
    </div>
  );
}
