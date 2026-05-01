import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#4A90D2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="20" height="26" viewBox="0 0 36 56" fill="none">
          <circle cx="6" cy="2.5" r="2.5" fill="white" />
          <circle cx="22" cy="2.5" r="2.5" fill="white" />
          <path d="M6 5 C6 10, 14 16, 14 16" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M22 5 C22 10, 14 16, 14 16" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M14 16 C24 18, 32 22, 30 28 C28 34, 18 36, 10 40" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M10 40 C4 43, 2 47, 8 50 C12 52, 22 50, 26 49" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M26 49 C26 47, 23 46, 23 47.5 C23 48.5, 26 51, 26 51 C26 51, 29 48.5, 29 47.5 C29 46, 26 47, 26 49 Z" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
