import Link from "next/link";
import { ShieldIcon } from "@/components/Brand";

function CTA(props: { href: string; label: string; solid?: boolean }) {
  const { href, label, solid = false } = props;
  const cls = solid
    ? "flex items-center gap-3 rounded-2xl px-5 py-4 mika-btn shadow"
    : "flex items-center gap-3 rounded-2xl px-5 py-4 mika-card shadow";
  return (
    <Link href={href} className={cls}>
      <span className={solid ? "text-white" : "mika-brand"}>✔</span>
      <span className="font-semibold">{label}</span>
    </Link>
  );
}

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <section className="mika-frame mb-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="mika-brand">
            <ShieldIcon className="h-16 w-16" />
          </div>
          <div className="mika-brand">
            <h1 className="text-4xl font-extrabold leading-tight">MiKa HACCP</h1>
            <p className="mt-2 opacity-70 mika-ink">
              Ihr digitaler Partner für Lebensmittelsicherheit
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:max-w-md">
          <CTA href="/frischetheke" label="Frischetheke ToDo's" solid />
          <CTA href="/markt" label="Markt ToDo's" />
          <CTA href="/dokumentation" label="Dokumentation" />
        </div>
      </section>
    </main>
  );
}
