import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.20.10.*", "172.20.10.2", "172.20.10.2:3000", "localhost:3000"],
};

export default nextConfig;

