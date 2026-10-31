import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: [
    "@whiite/description",
    "@whiite/imagegen",
    "@whiite/llm",
    "@whiite/memory",
    "@whiite/whiity",
  ],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default config;
