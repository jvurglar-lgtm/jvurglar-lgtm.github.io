import { readFileSync } from "node:fs";

const script = readFileSync(new URL("./script.js", import.meta.url), "utf8");
const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");

const checks = [
  ["two enemies state", /const ENEMY_COUNT = 2;/.test(script)],
  ["enemy array", /gameState\.enemies = /.test(script)],
  ["enemy rendering", /enemies\.forEach/.test(script)],
  ["enemy status text", /랜덤하게 움직이는 적 2개/.test(html)],
  ["enemy returns cell", /return next;/.test(script)],
];

const missing = checks.filter(([, ok]) => !ok).map(([name]) => name);

if (missing.length > 0) {
  throw new Error(`C2 missing: ${missing.join(", ")}`);
}

console.log("PASS");
