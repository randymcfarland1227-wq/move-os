import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("build contains Randy's Move OS metadata", async () => {
  const assetsDir = resolve(root, "dist-pages/assets");
  const assets = await readdir(assetsDir);
  const jsAsset = assets.find(file => file.endsWith(".js"));
  assert.ok(jsAsset, "expected a JavaScript bundle");
  const [html, bundle] = await Promise.all([
    readFile(resolve(root, "dist-pages/index.html"), "utf8"),
    readFile(resolve(assetsDir, jsAsset), "utf8"),
  ]);
  assert.match(html, /Randy's Move OS/);
  assert.match(bundle, /Chicago leading/);
  assert.match(bundle, /Working move window/);
  assert.doesNotMatch(html + bundle, /codex-preview/);
});

test("product source contains core interaction and repository boundaries", async () => {
  const [app, repository, priority] = await Promise.all([
    readFile(resolve(root, "app/move-os.tsx"), "utf8"),
    readFile(resolve(root, "app/repository.ts"), "utf8"),
    readFile(resolve(root, "app/priorities.ts"), "utf8"),
  ]);
  assert.match(app, /HomeDashboard/);
  assert.match(app, /CashFlowTool/);
  assert.match(app, /CaptureModal/);
  assert.match(app, /Export JSON/);
  assert.match(app, /Pre-Move/);
  assert.match(app, /Post-Move/);
  assert.match(repository, /interface MoveRepository/);
  assert.match(repository, /LocalMoveRepository/);
  assert.match(repository, /GoogleSheetsMoveRepository/);
  assert.match(priority, /Waiting for/);
});
