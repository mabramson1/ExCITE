export function DocsLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Two earpiece dots at top */}
      <circle cx="6" cy="2.5" r="2" fill="currentColor" />
      <circle cx="22" cy="2.5" r="2" fill="currentColor" />
      {/* Longer arms going down to Y-junction */}
      <path
        d="M6 4.5 C6 10, 14 16, 14 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M22 4.5 C22 10, 14 16, 14 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tubing curves from junction — the curve of the "2" */}
      <path
        d="M14 16 C24 18, 32 22, 30 28 C28 34, 18 36, 10 40"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bottom twist completing the "2" — curves back right with heart at end */}
      <path
        d="M10 40 C6 42, 4 44, 8 46 C10 47, 14 46, 14 46"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Heart at the end of the twist */}
      <path
        d="M14 46 C14 44, 11 43, 11 44.5 C11 45.5, 14 48, 14 48 C14 48, 17 45.5, 17 44.5 C17 43, 14 44, 14 46 Z"
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
      <g transform="translate(17, 8)">
        <circle cx="5" cy="2" r="1.8" fill="currentColor" />
        <circle cx="17" cy="2" r="1.8" fill="currentColor" />
        <path d="M5 3.8 C5 8, 11 12, 11 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M17 3.8 C17 8, 11 12, 11 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M11 12 C18 14, 25 17, 23 22 C21 27, 14 29, 8 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M8 32 C5 34, 3 35.5, 6 37 C7.5 37.5, 11 37, 11 37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M11 37 C11 35.5, 8.5 34.5, 8.5 36 C8.5 37, 11 39, 11 39 C11 39, 13.5 37, 13.5 36 C13.5 34.5, 11 35.5, 11 37 Z" fill="currentColor" />
      </g>
    </svg>
  );
}
