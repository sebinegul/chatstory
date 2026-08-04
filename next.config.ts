import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship prompt .txt files with serverless API routes that generate books
  outputFileTracingIncludes: {
    "/api/generate": ["./prompts/**/*"],
    "/api/chapters": ["./prompts/**/*"],
  },
};

export default nextConfig;
