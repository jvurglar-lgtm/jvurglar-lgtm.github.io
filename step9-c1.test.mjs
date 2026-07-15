import { readFileSync } from "node:fs";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");

const checks = [
  ["game developer headline", /게임 개발자/.test(html)],
  ["game developer bio", /브라우저 게임/.test(html)],
  ["game portfolio framing", /포트폴리오/.test(html)],
];

const missing = checks.filter(([, ok]) => !ok).map(([name]) => name);

if (missing.length > 0) {
  throw new Error(`C1 missing: ${missing.join(", ")}`);
}

console.log("PASS");
