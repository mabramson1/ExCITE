export function StethoscopeTwo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stethoscope tubing shaped as "2" */}
      <path
        d="M18 14 C18 14, 38 8, 46 16 C54 24, 48 34, 32 38 C16 42, 14 48, 18 52 C20 54, 46 54, 46 54"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Chest piece (circle at top-left start) */}
      <circle cx="16" cy="14" r="5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="14" r="2" fill="currentColor" />
      {/* Base line of the "2" */}
      <line x1="16" y1="54" x2="48" y2="54" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}
