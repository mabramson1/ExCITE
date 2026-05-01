export function DocsLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stethoscope tubing — curves like a "2" */}
      <path
        d="M12 4 C12 4, 36 0, 40 10 C44 20, 36 28, 24 32 C12 36, 8 40, 12 46"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Earpiece dot at top */}
      <circle cx="12" cy="4" r="3" fill="currentColor" />
      {/* Heart-shaped chest piece at bottom */}
      <path
        d="M12 46 C12 42, 6 40, 6 44 C6 47, 12 52, 12 52 C12 52, 18 47, 18 44 C18 40, 12 42, 12 46 Z"
        fill="currentColor"
      />
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
      <g transform="translate(14, 6)">
        {/* Stethoscope tubing */}
        <path
          d="M10 4 C10 4, 30 0, 33 9 C36 18, 30 24, 20 28 C10 32, 7 35, 10 40"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Earpiece */}
        <circle cx="10" cy="4" r="2.5" fill="currentColor" />
        {/* Heart */}
        <path
          d="M10 40 C10 37, 5 35.5, 5 38.5 C5 41, 10 45, 10 45 C10 45, 15 41, 15 38.5 C15 35.5, 10 37, 10 40 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
