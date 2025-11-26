'use client';

import { useRouter } from 'next/navigation';

export function useStartForm() {
  const router = useRouter();

  return async function onStart(definitionId: string, marketId: string | null, periodRef?: string) {
    try {
      const res = await fetch('/api/forms/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ definitionId, marketId, periodRef }),
      });

      const data: any = await res.json().catch(() => ({}));
      const id = data?.id ?? data?.item?.id;
      if (!res.ok || !id) throw new Error(data?.error || `HTTP ${res.status}`);

      // Ziel anpassen, falls dein Pfad anders ist:
      router.push(`/metzgerei/instance/${id}`);
    } catch (err: any) {
      console.error('Start error:', err);
      alert(`Fehler beim Erzeugen: ${err.message || err}`);
    }
  };
}
