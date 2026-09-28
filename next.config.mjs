import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n=================== DIAGNOSTIC INSPECTION ===================");
console.log("__dirname:", __dirname);

function listDir(dir, prefix = "") {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === "node_modules" || item === ".git" || item === ".next") continue;
      const fullPath = path.join(dir, item);
      const isDir = fs.statSync(fullPath).isDirectory();
      console.log(`${prefix}${isDir ? "📁" : "📄"} ${item}`);
      if (isDir && prefix.length < 6) {
        listDir(fullPath, prefix + "  ");
      }
    }
  } catch (err) {
    console.log(`${prefix}❌ Error reading ${dir}:`, err.message);
  }
}

listDir(__dirname);
console.log("=============================================================\n");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

export default nextConfig;
