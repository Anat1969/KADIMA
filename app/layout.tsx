import type { Metadata } from "next";
import "./globals.css";
import NavTabs from "@/components/NavTabs";
import DemoBanner from "@/components/DemoBanner";
import StoreBridge from "@/components/StoreBridge";

export const metadata: Metadata = {
  title: "קדימה — ניהול משימות ויוזמות",
  description: "כלי העבודה של אדריכלית העיר: קולט, מארגן, מנסח ומדווח"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <StoreBridge />
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <header className="pt-8 pb-4">
            <h1 className="text-2xl font-semibold tracking-tight">קדימה</h1>
            <p className="text-sm text-draft mt-1">תמיד צעד אחד לפני</p>
          </header>
          <NavTabs />
          <DemoBanner />
          <main className="mt-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
