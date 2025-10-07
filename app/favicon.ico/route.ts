const SVG_FAVICON = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5b1d2c" />
      <stop offset="50%" stop-color="#8c2f45" />
      <stop offset="100%" stop-color="#d4af37" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#g)" />
  <text
    x="50%"
    y="50%"
    font-family="'Amiri', 'Scheherazade New', serif"
    font-size="36"
    font-weight="700"
    fill="#fdf7e3"
    text-anchor="middle"
    dominant-baseline="central"
  >
    أ
  </text>
</svg>`

export function GET() {
  return new Response(SVG_FAVICON, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  })
}

