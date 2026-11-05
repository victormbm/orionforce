import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** Isolate the dev server while keeping the standard production directory expected by Vercel. */
export default function nextConfig(phase) {
  return {
    reactStrictMode: true,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
