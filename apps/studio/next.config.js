/** @type {import('next').NextConfig} */
const nextConfig = {
  // @lcos/shared and @violet-sphinx/names ship as raw TypeScript;
  // Next has to transpile them itself rather than load pre-built dist.
  // (@lcos/oripheon ships pre-built so it stays out of this list.)
  transpilePackages: ['@lcos/shared', '@violet-sphinx/names'],
};

module.exports = nextConfig;
