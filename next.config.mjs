/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: "export",
  reactCompiler: true,
  images: {
    unoptimized: true,
    domains: ["www.jisuniversity.ac.in"],
  },
};

export default nextConfig;
