/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  /* config options here */
  output: "export",
  reactCompiler: true,
  basePath: isProd ? "/camp-link" : "",
  assetPrefix: isProd ? "/camp-link/" : "",
  images: {
    unoptimized: true,
    domains: ["www.jisuniversity.ac.in"],
  },
};

export default nextConfig;
