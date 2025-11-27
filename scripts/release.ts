/* eslint-disable no-console */

import { $ } from "bun";
import fs from "fs";
import path from "path";

// 运行 tsdown 构建
await $`bun run build`;

// 读取原 package.json
const pkgPath = path.join(process.cwd(), "package.json");
const pkgText = await Bun.file(pkgPath).text();
const pkg = JSON.parse(pkgText);

// 获取版本号从参数
const version = process.argv[2];
if (!version) {
  console.error("Version must be provided as argument");
  process.exit(1);
}

// 创建发布用的 package.json

const distPkg = {
  name: pkg.name,
  version: version,
  main: "index.cjs",
  module: "index.js",
  type: "module",
  exports: {
    ".": {
      import: "./index.js",
      require: "./index.cjs",
      types: "./index.d.ts",
    },
  },
};

// 确保 dist 目录存在
const distDir = path.join(process.cwd(), "dist");
if (!Bun.file(distDir).exists()) {
  throw new Error("dist directory does not exist. Build failed?");
}

// 复制 README.md 到 dist/
await $`cp ${path.join(process.cwd(), "README.md")} ${distDir}`;

// 复制 LICENSE 到 dist/
await $`cp ${path.join(process.cwd(), "LICENSE")} ${distDir}`;

// 写入到 dist/package.json
await Bun.file(path.join(distDir, "package.json")).write(
  JSON.stringify(distPkg, null, 2)
);

console.log("Release preparation completed. package.json written to dist/");
