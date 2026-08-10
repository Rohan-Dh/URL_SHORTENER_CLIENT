/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next's dev server refuses to serve its JS chunks to a request whose
  // Origin isn't localhost/allowlisted (anti DNS-rebinding). Add LAN IPs
  // here when testing from another device on the network.
  allowedDevOrigins: ['10.0.1.186'],
};

export default nextConfig;
