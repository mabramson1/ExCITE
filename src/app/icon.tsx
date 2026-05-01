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
        <svg width="20" height="26" viewBox="0 0 36 52" fill="none">
          {/* Two earpiece dots */}
          <circle cx="8" cy="3" r="2.5" fill="white" />
          <circle cx="20" cy="3" r="2.5" fill="white" />
          {/* Two arms to junction */}
          <path d="M8 5.5 C8 9, 14 12, 14 12" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M20 5.5 C20 9, 14 12, 14 12" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Tubing curves */}
          <path d="M14 12 C14 12, 32 16, 30 24 C28 32, 16 34, 10 38" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Heart */}
          <path d="M10 38 C10 36, 6.5 35, 6.5 37 C6.5 38.5, 10 41.5, 10 41.5 C10 41.5, 13.5 38.5, 13.5 37 C13.5 35, 10 36, 10 38 Z" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
