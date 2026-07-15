import { readFileSync } from "node:fs";

function read(name) {
  return readFileSync(new URL(`./${name}`, import.meta.url), "utf8");
}

const html = read("index.html");
const script = read("script.js");
const styles = read("styles.css");

const checks = [
  ["game canvas", /id="game-canvas"/.test(html)],
  ["scoreboard", /id="score-value"/.test(html) && /id="best-score-value"/.test(html)],
  ["pause button", /id="pause-button"/.test(html)],
  ["restart button", /id="restart-button"/.test(html)],
  ["touch controls", /class="touch-controls"/.test(html)],
  ["snake state", /const gameState = /.test(script)],
  ["keyboard controls", /addEventListener\("keydown"/.test(script)],
  ["direction guard", /isOppositeDirection/.test(script)],
  ["enemy feature", /enemy/.test(script)],
  ["game styles", /\.games-shell/.test(styles) && /\.touch-controls/.test(styles)],
];

const missing = checks.filter(([, passed]) => !passed).map(([name]) => name);

if (missing.length > 0) {
  throw new Error(`Missing expected features: ${missing.join(", ")}`);
}

console.log("PASS");
