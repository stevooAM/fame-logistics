/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// Derive the backend API origin for CSP connect-src from NEXT_PUBLIC_API_URL.
// Accept either the backend origin or an origin mistakenly suffixed with /api.
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const apiUrl = rawApiUrl.replace(/\/+$/, "").replace(/\/api$/, "");
let apiOrigin = "http://localhost:8000";
try {
  apiOrigin = new URL(apiUrl).origin;
} catch (_e) {
  // leave default
}

// Dev: permissive — Next.js HMR needs 'unsafe-eval' and ws: for websockets
// Prod: locks down to self + the API origin; no eval
const cspDirectives = isProd
  ? [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' ${apiOrigin}`,
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ")
  : [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' http://localhost:* ws://localhost:* https:",
      "frame-ancestors 'none'",
    ].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*/`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
