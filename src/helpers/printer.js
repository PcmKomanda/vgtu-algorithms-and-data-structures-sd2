import readline from "readline";
import logger from "../logger.js";
import { all } from "./ascii.js";

const IS_TTY = process.stdout.isTTY;

export async function printAt(x, y, text, options = {}) {
  const { restoreCursor = true, log = false } = options;
  if (!IS_TTY) {
    logger("Cannot printAt: Not a terminal");
    console.log("Klaida");
    return;
  }

  const cx = Math.floor(x);
  const cy = Math.floor(y);
  cursorTo(cx, cy);
  write(text);
  if (restoreCursor) resetCursor();
  if (log) logger(`Printing at (${cx}, ${cy}): ${text}`);
}

export function printBatch(lines = [], options = {}) {
  const { log = false } = options;
  if (!IS_TTY) {
    if (log) logger("Cannot printBatch: Not a terminal");
    return;
  }
  let out = "";
  for (const l of lines) {
    const cx = Math.floor(l.x);
    const cy = Math.floor(l.y);
    out += `\u001b[${cy + 1};${cx + 1}H${l.text}`;
    if (log) logger(`Queued (${cx},${cy}): ${l.text}`);
  }
  write(out);
}

export function clearScreenArea(x, y, width, height) {
  if (!IS_TTY) return;
  const blankLine = " ".repeat(width);
  for (let i = 0; i < height; i++) {
    printAt(x, y + i, blankLine, { restoreCursor: false });
  }
}

export function resetCursor() {
  cursorTo(0, 0);
}

function cursorTo(x, y) {
  if (!IS_TTY) return;
  readline.cursorTo(process.stdout, x, y);
}

function write(text) {
  process.stdout.write(text);
}

export function printRPS(x, y, choice) {
  const rps = all;
  const art = rps[choice.toLowerCase()];
  if (!art) {
    logger(`No ASCII art found for choice: ${choice}`);
    return;
  }
  const lines = art.split("\n");
  lines.forEach((line, index) => {
    printAt(x, y + index, line);
  });
}
