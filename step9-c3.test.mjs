import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { clearCompletedLines, rotateMatrix } from "./tetris.js";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");

assert.match(html, /id="tetris-canvas"/, "tetris canvas should exist");
assert.match(html, /id="tetris-score-value"/, "tetris score should exist");
assert.match(html, /id="tetris-start-button"/, "tetris start button should exist");
assert.match(html, /id="tetris-rotate-button"/, "tetris rotate button should exist");

const rotated = rotateMatrix([
  [1, 0],
  [1, 1],
]);

assert.deepEqual(rotated, [
  [1, 1],
  [1, 0],
]);

const cleared = clearCompletedLines([
  [null, 1, null, null],
  [1, 1, 1, 1],
  [1, null, 1, null],
]);

assert.deepEqual(cleared, [
  [null, null, null, null],
  [null, 1, null, null],
  [1, null, 1, null],
]);

console.log("PASS");
