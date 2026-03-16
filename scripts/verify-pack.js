"use strict";

const { execSync } = require("child_process");

const blockedPrefixes = [
  ".agents/",
  ".gemini/",
  "example/",
  "android/build/",
];

const blockedNames = new Set([".DS_Store"]);

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

const output = execSync("npm pack --dry-run --json", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
}).trim();

if (!output) {
  throw new Error("npm pack --dry-run --json returned empty output.");
}

let packInfo;
try {
  const parsed = JSON.parse(output);
  packInfo = Array.isArray(parsed) ? parsed[0] : parsed;
} catch (error) {
  throw new Error(`Cannot parse npm pack output: ${error.message}`);
}

const files = Array.isArray(packInfo?.files) ? packInfo.files : [];
const violations = [];

for (const file of files) {
  const path = String(file.path || "");
  if (!path) continue;
  if (blockedPrefixes.some((prefix) => path.startsWith(prefix))) {
    violations.push(path);
    continue;
  }
  const parts = path.split("/");
  if (parts.some((part) => blockedNames.has(part))) {
    violations.push(path);
  }
}

console.log(`Package: ${packInfo.name}@${packInfo.version}`);
console.log(`Files: ${files.length}`);
console.log(`Package size: ${formatBytes(packInfo.size)}`);
console.log(`Unpacked size: ${formatBytes(packInfo.unpackedSize)}`);

if (violations.length > 0) {
  console.error("\nBlocked files found in tarball:");
  for (const file of violations) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("Pack verification passed.");
