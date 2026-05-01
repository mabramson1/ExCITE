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
          <path d="M10 40 C6 42, 4 44, 8 46 C10 47, 14 46, 14 46" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M14 46 C14 44, 11 43, 11 44.5 C11 45.5, 14 48, 14 48 C14 48, 17 45.5, 17 44.5 C17 43, 14 44, 14 46 Z" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
