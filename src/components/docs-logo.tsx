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
      {/* Bottom curve completing the "2" — sweeps left then hooks right */}
      <path
        d="M10 40 C4 43, 2 47, 8 50 C12 52, 22 50, 26 49"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Heart at the end */}
      <path
        d="M26 49 C26 47, 23 46, 23 47.5 C23 48.5, 26 51, 26 51 C26 51, 29 48.5, 29 47.5 C29 46, 26 47, 26 49 Z"
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
        <path d="M8 32 C3 34, 1 37.5, 6 39.5 C9 41, 17 39.5, 20 39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M20 39 C20 37.5, 17.5 37, 17.5 38 C17.5 38.8, 20 41, 20 41 C20 41, 22.5 38.8, 22.5 38 C22.5 37, 20 37.5, 20 39 Z" fill="currentColor" />
      </g>
    </svg>
  );
}
