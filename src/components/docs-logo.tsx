export function DocsLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Two earpiece dots at top */}
      <circle cx="8" cy="3" r="2" fill="currentColor" />
      <circle cx="20" cy="3" r="2" fill="currentColor" />
      {/* Two arms going down to Y-junction */}
      <path
        d="M8 5 C8 9, 14 12, 14 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20 5 C20 9, 14 12, 14 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tubing curves down from junction — forms the "2" shape */}
      <path
        d="M14 12 C14 12, 32 16, 30 24 C28 32, 16 34, 10 38"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Heart-shaped chest piece at bottom */}
      <path
        d="M10 38 C10 36, 6.5 35, 6.5 37 C6.5 38.5, 10 41.5, 10 41.5 C10 41.5, 13.5 38.5, 13.5 37 C13.5 35, 10 36, 10 38 Z"
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
      <g transform="translate(17, 10)">
        {/* Two earpiece dots */}
        <circle cx="6" cy="2.5" r="1.8" fill="currentColor" />
        <circle cx="18" cy="2.5" r="1.8" fill="currentColor" />
        {/* Two arms to junction */}
        <path d="M6 4.3 C6 7.5, 12 10, 12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M18 4.3 C18 7.5, 12 10, 12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Tubing curves */}
        <path d="M12 10 C12 10, 27 13, 25 20 C23 27, 13 28, 8 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Heart */}
        <path d="M8 32 C8 30.5, 5.5 29.5, 5.5 31 C5.5 32, 8 34.5, 8 34.5 C8 34.5, 10.5 32, 10.5 31 C10.5 29.5, 8 30.5, 8 32 Z" fill="currentColor" />
      </g>
    </svg>
  );
}
