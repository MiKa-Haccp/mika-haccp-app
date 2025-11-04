export function ShieldIcon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="1.5"
        d="M12 3.5l7 2.4v5.7c0 4.4-3 8.4-7 9.5-4-1.1-7-5.1-7-9.5V5.9l7-2.4z"/>
      <path fill="currentColor"
        d="M10.2 12.6l-1.5-1.5a.9.9 0 10-1.3 1.3l2.2 2.2a.9.9 0 001.3 0l4.7-4.7a.9.9 0 10-1.3-1.3l-4.1 4z"/>
    </svg>
  );
}

export default function Brand({ size = "text-3xl" }: { size?: string }) {
  return (
    <div className={`flex items-center gap-3 ${size}`}>
      {/* Nur das Schild – kein weißes "MI" mehr */}
      <div className="mika-brand">
        <ShieldIcon />
      </div>
      <div className="leading-tight">
        <div className="font-extrabold mika-brand">MiKa HACCP</div>
        <div className="text-sm/5 opacity-70">Ihr digitaler Partner für Lebensmittelsicherheit</div>
      </div>
    </div>
  );
}
