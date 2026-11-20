export function ContinuaMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="Continua mark">
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#0f766e" />
      <path d="M9 16h14M16 9v14" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
