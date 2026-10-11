/**
 * The OpenKuasa mark: a central orb (the assistant) with six small satellites,
 * one per product, circling it on a thin orbit. 24 × 24 box.
 */
const SATELLITES = Array.from({ length: 6 }, (_, i) => {
  const a = (i * 60 - 90) * (Math.PI / 180);
  return { x: +(12 + 9 * Math.cos(a)).toFixed(2), y: +(12 + 9 * Math.sin(a)).toFixed(2) };
});

export function OrbMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <circle cx="12" cy="12" r="4.4" />
      {SATELLITES.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r="1.9" />
      ))}
    </svg>
  );
}
