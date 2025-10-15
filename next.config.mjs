/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: File size limits for uploads are handled in the upload handler and client-side validation
  // The default body size limit for Next.js API routes is 1MB
  // For larger files, we use external services like S3 with pre-signed URLs
};

export default nextConfig;
