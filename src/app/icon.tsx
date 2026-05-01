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
        <svg width="22" height="26" viewBox="0 0 48 56" fill="none">
          <path
            d="M12 4 C12 4, 36 0, 40 10 C44 20, 36 28, 24 32 C12 36, 8 40, 12 46"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="12" cy="4" r="3.5" fill="white" />
          <path
            d="M12 46 C12 42, 6 40, 6 44 C6 47, 12 52, 12 52 C12 52, 18 47, 18 44 C18 40, 12 42, 12 46 Z"
            fill="white"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
