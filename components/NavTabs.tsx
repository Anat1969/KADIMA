"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "זרימה" },
  { href: "/table", label: "טבלה" },
  { href: "/map", label: "מפת עבודה" },
  { href: "/gallery", label: "גלריה" },
  { href: "/report", label: "דוח למנכ\"ל" }
];

export default function NavTabs() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 border-b border-line">
      {TABS.map((t) => {
        // תת-מסכים (למשל /gallery/שילוט) מדגישים את הלשונית שלהם.
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              "px-4 py-2 text-sm border-b-2 -mb-px transition-colors " +
              (active
                ? "border-accent text-accent font-medium"
                : "border-transparent text-draft hover:text-ink")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
