import assert from "node:assert/strict";
import { createServer } from "node:http";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "@playwright/test";

const root = join(process.cwd(), "docs");
const basePath = "/discovery-to-architecture-workbench/";
const port = 4178;
const updateSnapshots = process.argv.includes("--update-snapshots");
const baselineDir = join(process.cwd(), "tests", "responsive-baselines");
const currentDir = join(process.cwd(), "work", "responsive-current");
const viewports = [
  { name: "compact-mobile", width: 320, height: 800 },
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "short-desktop", width: 1440, height: 700 },
];
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function serveBuild() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? basePath, `http://127.0.0.1:${port}`);
      if (url.pathname === "/favicon.ico") {
        response.writeHead(204);
        response.end();
        return;
      }
      const relative = url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) : "";
      const safePath = normalize(relative || "index.html").replace(/^(\.\.(\\|\/|$))+/, "");
      const file = join(root, safePath);
      const content = await readFile(file);
      response.writeHead(200, { "content-type": mimeTypes[extname(file)] ?? "application/octet-stream" });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
}

async function stop(server) {
  if (!server.listening) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function openDecision(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`http://127.0.0.1:${port}${basePath}`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Decide" }).click();
  await page.getByRole("heading", { name: "Not ready yet." }).waitFor();
}

async function checkNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(metrics.document <= metrics.viewport + 1, `${label}: document is ${metrics.document}px wide in a ${metrics.viewport}px viewport`);
  assert.ok(metrics.body <= metrics.viewport + 1, `${label}: body is ${metrics.body}px wide in a ${metrics.viewport}px viewport`);
}

async function checkContentIsContained(page, label) {
  const metrics = await page.evaluate(() => {
    const workbench = document.querySelector(".workbench");
    const stage = document.querySelector(".stage-frame");
    const footer = document.querySelector(".workbench-footer");
    if (!workbench || !stage || !footer) return null;
    return {
      workbenchBottom: Math.round(workbench.getBoundingClientRect().bottom),
      footerBottom: Math.round(footer.getBoundingClientRect().bottom),
      stageClientHeight: stage.clientHeight,
      stageScrollHeight: stage.scrollHeight,
    };
  });
  assert.ok(metrics, `${label}: expected Workbench containers were not found`);
  assert.ok(metrics.footerBottom <= metrics.workbenchBottom + 1, `${label}: content extends beyond the Workbench surface`);
  assert.ok(metrics.stageScrollHeight <= metrics.stageClientHeight + 1, `${label}: stage content is clipped vertically`);
}

async function checkMinimumFontSize(page, selector, minimum, label) {
  const sizes = await page.locator(selector).evaluateAll((nodes) => nodes.filter((node) => node.getClientRects().length).map((node) => Number.parseFloat(getComputedStyle(node).fontSize)));
  assert.ok(sizes.length > 0, `${label}: no visible text matched ${selector}`);
  for (const size of sizes) assert.ok(size >= minimum, `${label}: ${selector} rendered at ${size}px, below ${minimum}px`);
}

async function checkTouchTargets(page, label) {
  for (const selector of [".view-switch button", ".progress-steps button", ".decision-links button", ".stage-actions button"]) {
    const heights = await page.locator(selector).evaluateAll((nodes) => nodes.filter((node) => node.getClientRects().length).map((node) => Math.round(node.getBoundingClientRect().height)));
    for (const height of heights) assert.ok(height >= 40, `${label}: ${selector} rendered at ${height}px tall`);
  }
}

async function checkDrawers(page, label) {
  for (const button of ["View evaluation", "View sources", "View journey"]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await checkNoHorizontalOverflow(page, `${label} ${button} drawer`);
    await page.getByRole("button", { name: "Close drawer" }).click();
  }
}

async function checkAllPrimaryStates(page, label) {
  for (const stage of ["Problem", "Discovery", "Design", "Test", "Decide"]) {
    const tab = page.getByRole("tab", { name: stage, exact: true });
    await tab.click();
    assert.equal(await tab.getAttribute("aria-selected"), "true", `${label}: ${stage} did not become active`);
    await checkNoHorizontalOverflow(page, `${label} original ${stage}`);
    await checkContentIsContained(page, `${label} original ${stage}`);
  }

  await page.getByRole("tab", { name: "Change control", exact: true }).click();
  for (const stage of ["Request", "Impact", "Tests", "Release gate", "Rollback"]) {
    const tab = page.getByRole("tab", { name: stage, exact: true });
    await tab.click();
    assert.equal(await tab.getAttribute("aria-selected"), "true", `${label}: ${stage} did not become active`);
    await checkNoHorizontalOverflow(page, `${label} change control ${stage}`);
    await checkContentIsContained(page, `${label} change control ${stage}`);
  }
}

async function checkSnapshot(page, name) {
  await mkdir(baselineDir, { recursive: true });
  await mkdir(currentDir, { recursive: true });
  const current = join(currentDir, `${name}.png`);
  const baseline = join(baselineDir, `${name}.png`);
  await page.screenshot({ path: current, fullPage: true, animations: "disabled" });

  if (updateSnapshots) {
    await copyFile(current, baseline);
    return;
  }

  let expected;
  try {
    expected = await readFile(baseline);
  } catch {
    throw new Error(`${name}: approved screenshot is missing. Run npm run test:responsive -- --update-snapshots after visual review.`);
  }
  const actual = await readFile(current);
  assert.ok(actual.equals(expected), `${name}: layout differs from the approved screenshot. Review ${current}`);
}

const server = serveBuild();
let browser;

try {
  await listen(server);
  browser = await chromium.launch({ channel: "msedge", headless: true });

  for (const viewport of viewports) {
    const page = await browser.newPage();
    const browserErrors = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) browserErrors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400) browserErrors.push(`${response.status()} ${response.url()}`);
    });

    await openDecision(page, viewport);
    await checkNoHorizontalOverflow(page, viewport.name);
    await checkContentIsContained(page, viewport.name);
    await checkMinimumFontSize(page, ".decision-copy > .decision-primary > p", viewport.width <= 600 ? 15 : 14, viewport.name);
    await checkMinimumFontSize(page, ".decision-gates b", 14, viewport.name);
    await checkMinimumFontSize(page, ".decision-gates small", viewport.width <= 600 ? 14 : 12, viewport.name);
    await checkMinimumFontSize(page, ".decision-links button", viewport.width <= 600 ? 14 : 13, viewport.name);
    if (viewport.width <= 600) await checkTouchTargets(page, viewport.name);
    if (viewport.name === "mobile" || viewport.name === "desktop") await checkDrawers(page, viewport.name);
    if (viewport.name === "mobile" || viewport.name === "desktop") await checkSnapshot(page, `decision-${viewport.name}`);
    await checkAllPrimaryStates(page, viewport.name);
    assert.deepEqual(browserErrors, [], `${viewport.name}: browser errors detected`);
    await page.close();
    process.stdout.write(`PASS ${viewport.name}\n`);
  }
} finally {
  if (browser) await browser.close();
  await stop(server);
}

process.stdout.write("Responsive QA passed.\n");
