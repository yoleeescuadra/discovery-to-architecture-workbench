import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds a deployable GitHub Pages edition", async () => {
  const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");

  assert.match(html, /Discovery-to-Architecture Workbench/);
  assert.match(html, /\/discovery-to-architecture-workbench\/assets\//);
  assert.match(html, /<div id="root"><\/div>/);
  await access(new URL("../docs/og.png", import.meta.url));
  await access(new URL("../docs/.nojekyll", import.meta.url));
});
