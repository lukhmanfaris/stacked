import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict Mode double-mounts in dev cause Supabase auth lock warnings (orphaned
  // locks from the first mount's onAuthStateChange). Not a production issue.
  reactStrictMode: false,
};

export default nextConfig;
