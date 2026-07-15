import { readFileSync } from "node:fs";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

const checks = [
  ["dark bg", /--bg:\s*#05070d;/.test(styles)],
  ["elevated bg", /--bg-elevated:\s*#0b101a;/.test(styles)],
  ["accent", /--accent:\s*#7dd3fc;/.test(styles)],
  ["page bg", /background:\s*var\(--bg\)/.test(styles)],
  ["button gradient", /linear-gradient\(135deg,\s*var\(--accent\),\s*var\(--accent-strong\)\)/.test(styles)],
];

const missing = checks.filter(([, ok]) => !ok).map(([name]) => name);

if (missing.length > 0) {
  throw new Error(`C1 missing: ${missing.join(", ")}`);
}

console.log("PASS");
