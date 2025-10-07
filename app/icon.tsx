import { ImageResponse } from "next/og"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"
export const runtime = "edge"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #5b1d2c 0%, #8c2f45 45%, #d4af37 100%)",
          borderRadius: "16px",
          color: "#fdf7e3",
          display: "flex",
          fontSize: 36,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        أ
      </div>
    ),
    {
      ...size,
    },
  )
}
