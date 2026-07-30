#!/usr/bin/env node
/**
 * beforeShellExecution hook: deny git push when known seed-demo-bug fingerprints
 * are present in the working tree. Fails open on unexpected errors.
 *
 * Fingerprints from .cursor/skills/seed-demo-bug/SKILL.md bug catalog.
 */

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const REPO_ROOT = process.cwd();

/** @param {string} relPath */
function readRepoFile(relPath) {
  const abs = `${REPO_ROOT}/${relPath}`;
  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf8");
}

/** Bug A: rightY → rightX typo in getDiamondBaseCorners */
function hasBugA() {
  const content = readRepoFile("packages/element/src/utils.ts");
  if (!content) return false;
  // Seeded: element.y + rightX in the right corner (should be rightY)
  return /getDiamondBaseCorners/.test(content) && /element\.y \+ rightX/.test(content);
}

/** Bug B: numericKey off-by-one in findShapeByKey */
function hasBugB() {
  const content = readRepoFile("packages/excalidraw/components/shapes.tsx");
  if (!content) return false;
  return /Number\(shape\.numericKey\) \+ 1/.test(content);
}

/** Bug C: strokeColor written to backgroundColor in actionChangeStrokeColor */
function hasBugC() {
  const content = readRepoFile("packages/excalidraw/actions/actionProperties.tsx");
  if (!content) return false;
  // Seeded perform uses backgroundColor where strokeColor belongs
  const performBlock = content.match(
    /actionChangeStrokeColor[\s\S]*?perform\s*:\s*\([\s\S]*?\n\s*\},/,
  );
  if (!performBlock) return false;
  return (
    /backgroundColor:\s*value\.currentItemStrokeColor/.test(performBlock[0]) ||
    /newElementWith\(el,\s*\{\s*backgroundColor:\s*value\.currentItemStrokeColor/.test(
      performBlock[0],
    )
  );
}

function detectSeededBugs() {
  const found = [];
  if (hasBugA()) found.push("A (diamond ghost hit-box)");
  if (hasBugB()) found.push("B (tool shortcut off-by-one)");
  if (hasBugC()) found.push("C (stroke picker paints fill)");
  return found;
}

function isGitPush(command) {
  if (!command || typeof command !== "string") return false;
  const trimmed = command.trim();
  return /^git\s+push\b/.test(trimmed);
}

function allow() {
  console.log(JSON.stringify({ permission: "allow" }));
  process.exit(0);
}

function deny(bugs) {
  console.log(
    JSON.stringify({
      permission: "deny",
      user_message:
        "Push blocked: seeded demo bug fingerprint(s) detected in the working tree. Run demo-reset or revert the seeded files before pushing.",
      agent_message: `Hook blocked git push. Detected seed-demo-bug fingerprint(s): ${bugs.join(", ")}. Never push seeded bugs to origin.`,
    }),
  );
  process.exit(0);
}

function main() {
  let input = "";
  try {
    input = readFileSync(0, "utf8");
  } catch {
    allow();
  }

  let payload;
  try {
    payload = JSON.parse(input || "{}");
  } catch {
    allow();
  }

  const command = payload.command ?? payload.shellCommand ?? "";
  if (!isGitPush(command)) {
    allow();
  }

  const bugs = detectSeededBugs();
  if (bugs.length > 0) {
    deny(bugs);
  }

  allow();
}

// Self-test mode: node block-seeded-bug-push.mjs --self-test
if (process.argv.includes("--self-test")) {
  let passed = 0;
  let total = 0;

  function assert(name, condition) {
    total++;
    if (condition) {
      passed++;
      console.log(`PASS: ${name}`);
    } else {
      console.error(`FAIL: ${name}`);
    }
  }

  // Inline detection helpers for unit tests (no disk reads)
  function detectBugAIn(content) {
    return /getDiamondBaseCorners/.test(content) && /element\.y \+ rightX/.test(content);
  }
  function detectBugBIn(content) {
    return /Number\(shape\.numericKey\) \+ 1/.test(content);
  }
  function detectBugCIn(content) {
    return /backgroundColor:\s*value\.currentItemStrokeColor/.test(content);
  }

  assert("Bug A detects seeded typo", detectBugAIn("getDiamondBaseCorners element.y + rightX"));
  assert("Bug A ignores correct code", !detectBugAIn("getDiamondBaseCorners element.y + rightY"));
  assert("Bug B detects off-by-one", detectBugBIn("Number(shape.numericKey) + 1"));
  assert("Bug B ignores correct code", !detectBugBIn("shape.numericKey.toString()"));
  assert("Bug C detects wrong property", detectBugCIn("backgroundColor: value.currentItemStrokeColor"));
  assert("Bug C ignores correct code", !detectBugCIn("strokeColor: value.currentItemStrokeColor"));

  assert("isGitPush matches push", isGitPush("git push origin master"));
  assert("isGitPush ignores typecheck", !isGitPush("yarn test:typecheck"));

  // Live tree should not have seeded bugs on clean checkout
  const liveBugs = detectSeededBugs();
  assert("clean tree has no seeded bugs", liveBugs.length === 0);

  console.log(`Self-test: ${passed}/${total} passed`);
  process.exit(passed === total ? 0 : 1);
}

try {
  main();
} catch (err) {
  // Fail open
  allow();
}
