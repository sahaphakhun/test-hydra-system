"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  pageExtensions: ['tsx', 'ts'],
  /* config options here */
};
module.exports = nextConfig;
