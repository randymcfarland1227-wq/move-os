import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("build contains Move OS product metadata", async () => {
  const worker = await readFile(resolve(root, "dist/server/index.js"), "utf8");
  assert.match(worker, /Move OS/);
  assert.match(worker, /gentler way forward/);
  assert.doesNotMatch(worker, /codex-preview/);
});

test("product source contains core interaction and repository boundaries", async () => {
  const [app, repository, priority] = await Promise.all([
    readFile(resolve(root, "app/move-os.tsx"), "utf8"),
    readFile(resolve(root, "app/repository.ts"), "utf8"),
    readFile(resolve(root, "app/priorities.ts"), "utf8"),
  ]);
  assert.match(app, /I feel overwhelmed/);
  assert.match(app, /Export all data/);
  assert.match(repository, /interface MoveRepository/);
  assert.match(repository, /LocalMoveRepository/);
  assert.match(priority, /Waiting for/);
});
