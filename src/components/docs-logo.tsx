export function DocsLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Earpiece nub at top */}
      <circle cx="10" cy="3" r="2.5" fill="currentColor" />
      {/* Stethoscope tubing — curves like a "2" */}
      <path
        d="M10 5.5 C10 5.5, 32 2, 34 12 C36 22, 28 28, 18 32 C8 36, 6 39, 10 43"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Heart-shaped chest piece */}
      <path
        d="M10 43 C10 40.5, 5.5 39, 5.5 41.5 C5.5 43.5, 10 47.5, 10 47.5 C10 47.5, 14.5 43.5, 14.5 41.5 C14.5 39, 10 40.5, 10 43 Z"
        fill="currentColor"
      />
      {/* Base line of the "2" */}
      <line x1="8" y1="43" x2="34" y2="43" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function DocsLogoCircle({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" />
      <g transform="translate(16, 8)">
        <circle cx="8" cy="3" r="2" fill="currentColor" />
        <path
          d="M8 5 C8 5, 26 2, 28 10 C30 18, 24 23, 15 26 C6 29, 4 32, 8 35"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 35 C8 33, 4.5 32, 4.5 34 C4.5 35.5, 8 38.5, 8 38.5 C8 38.5, 11.5 35.5, 11.5 34 C11.5 32, 8 33, 8 35 Z"
          fill="currentColor"
        />
        <line x1="6" y1="35" x2="28" y2="35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
