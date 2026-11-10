import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  env: {
    // Reown project IDs are public client identifiers. Keep the source value
    // in the deployment environment while exposing only this single setting.
    NEXT_PUBLIC_REOWN_PROJECT_ID:
      process.env.REOWN_PROJECT_ID || process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "",
  },
  experimental: {
    // Keep page-data generation bounded on Windows and in CI. Next otherwise
    // creates one worker per logical CPU, which can exhaust the available
    // commit limit before a single page fails to compile.
    cpus: 2,
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
