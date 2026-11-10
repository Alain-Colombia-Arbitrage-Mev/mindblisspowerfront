import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: projectRoot,
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
