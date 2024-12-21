/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.modules.push(process.cwd() + '/node_modules')
    return config
  }
}

module.exports = nextConfig 