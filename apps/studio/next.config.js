const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // @lcos/shared ships raw TypeScript, so Next has to transpile it.
  // @violet-sphinx/names ships pre-built dist; loaded via webpack
  // alias below (pnpm symlink-walking from oripheon's compiled dist
  // didn't reliably resolve in Next 14).
  transpilePackages: ['@lcos/shared'],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@violet-sphinx/names': path.resolve(
        __dirname,
        '../../../violet-sphinx-names/dist/index.js'
      ),
    };
    return config;
  },
};

module.exports = nextConfig;
