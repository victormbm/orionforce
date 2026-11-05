import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** Keep development and production output separate so builds cannot corrupt a running dev server. */
export default function nextConfig(phase) {
  return {
    reactStrictMode: true,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next-production",
  };
}
