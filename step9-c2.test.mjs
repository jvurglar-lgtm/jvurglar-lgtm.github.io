import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

const checks = [
  ["facebook blue", /--primary:\s*#1877f2;/.test(styles)],
  ["facebook background", /--bg:\s*#f0f2f5;/.test(styles)],
  ["surface white", /--surface:\s*#ffffff;/.test(styles)],
  ["page background uses bg", /background:\s*var\(--bg\)/.test(styles)],
  ["card radius", /--radius:\s*24px;/.test(styles)],
];

const missing = checks.filter(([, ok]) => !ok).map(([name]) => name);

if (missing.length > 0) {
  throw new Error(`C2 missing: ${missing.join(", ")}`);
}

console.log("PASS");
