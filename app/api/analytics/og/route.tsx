import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const name = searchParams.get("name") || "Creator";
  const username = searchParams.get("username") || "creator";
  const platform = searchParams.get("platform") || "Instagram";
  const score = searchParams.get("score") || "82";
  const er = searchParams.get("er") || "3.5";
  const followers = searchParams.get("followers") || "100K";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #05070f 0%, #0c0d1e 50%, #120d2b 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "60px 80px",
            gap: "32px",
            height: "100%",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: "900",
                color: "white",
                fontStyle: "italic",
              }}
            >
              w
            </div>
            <span style={{ color: "white", fontWeight: "800", fontSize: "20px" }}>
              wecollab
            </span>
            <span
              style={{
                marginLeft: "auto",
                background: "rgba(139,92,246,0.2)",
                border: "1px solid rgba(139,92,246,0.4)",
                color: "#a78bfa",
                fontSize: "12px",
                fontWeight: "700",
                padding: "6px 16px",
                borderRadius: "100px",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              ✨ Free Creator Analytics
            </span>
          </div>

          {/* Creator card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "40px",
              flex: 1,
            }}
          >
            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              <div style={{ color: "#94a3b8", fontSize: "16px", fontWeight: "600" }}>
                {platform} • AI Creator Report
              </div>
              <div
                style={{
                  color: "white",
                  fontSize: "52px",
                  fontWeight: "900",
                  lineHeight: "1.1",
                  letterSpacing: "-1px",
                }}
              >
                {name}
              </div>
              <div style={{ color: "#6366f1", fontSize: "22px", fontWeight: "700" }}>
                @{username}
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: "32px", marginTop: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ color: "white", fontSize: "28px", fontWeight: "900" }}>
                    {followers}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Followers
                  </div>
                </div>
                <div style={{ width: "1px", background: "#1e293b" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ color: "white", fontSize: "28px", fontWeight: "900" }}>
                    {er}%
                  </div>
                  <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Engagement
                  </div>
                </div>
              </div>
            </div>

            {/* Score circle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "28px",
                padding: "40px 48px",
              }}
            >
              <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "2px" }}>
                AI Creator Score
              </div>
              <div
                style={{
                  fontSize: "90px",
                  fontWeight: "900",
                  background: "linear-gradient(135deg, #818cf8, #a78bfa)",
                  backgroundClip: "text",
                  color: "transparent",
                  lineHeight: "1",
                  WebkitBackgroundClip: "text",
                }}
              >
                {score}
              </div>
              <div style={{ color: "#64748b", fontSize: "16px", fontWeight: "600" }}>/100</div>
              <div style={{ color: "#a78bfa", fontSize: "14px", fontWeight: "700" }}>
                🏆 Top Creator
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "20px",
            }}
          >
            <div style={{ color: "#334155", fontSize: "14px", fontWeight: "600" }}>
              wecollab.in/analytics
            </div>
            <div style={{ color: "#334155", fontSize: "14px", fontWeight: "600" }}>
              Free • No Login Required • Instant Report
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
