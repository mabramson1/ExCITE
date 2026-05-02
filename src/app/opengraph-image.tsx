import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Docs² — Docs for Docs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #eef5fc 50%, #dbeafe 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "80px",
              fontWeight: 800,
              color: "#1a1a2e",
              letterSpacing: "-2px",
              display: "flex",
              alignItems: "baseline",
            }}
          >
            docs
            <span
              style={{
                fontSize: "48px",
                color: "#4A90D2",
                fontWeight: 800,
                position: "relative",
                top: "-24px",
              }}
            >
              2
            </span>
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#4A90D2",
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Docs for Docs
          </div>
          <div
            style={{
              fontSize: "20px",
              color: "#64748b",
              maxWidth: "600px",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            AI-powered medical writing suite with built-in PHI auto-detection
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            {["Clinical Notes", "Manuscripts", "AI Detector", "De-AI-ifier"].map(
              (tool) => (
                <div
                  key={tool}
                  style={{
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    color: "#475569",
                    fontWeight: 500,
                  }}
                >
                  {tool}
                </div>
              )
            )}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "16px",
            color: "#94a3b8",
          }}
        >
          docsquared.app
        </div>
      </div>
    ),
    { ...size }
  );
}
