// Headless-WebGPU smoke test — the one check the rest of the suite can't do.
//
// The Node tests (compat/reconciler/pure-layer) and `vite build` never touch a GPU, so a WGSL
// compile/validation error is invisible to them: it only surfaces when the GPU CREATES or USES a
// pipeline in a browser (e.g. the box-shadow `fwidth`-in-non-uniform-control-flow bug, which
// blanked every shadowed frame while every headless check stayed green). This mounts the BUILT
// demo in real (headless, software) WebGPU and asserts the renderer comes up clean: a WebGPU
// adapter is present, a <canvas> mounts, the WebGPU-unsupported fallback is NOT shown
// (createGpuRoot succeeded), and NO GPU/shader/renderer error reaches the console (the Painter
// logs `uncapturederror` + device-loss, so a bad pipeline shows up here).
//
// Run: npm run build && node test/browser.test.mjs   (needs `npx playwright install chromium`)
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist-site/", import.meta.url));
const BASE_PREFIX = "/kussetsu"; // vite build base (GitHub Pages: /<repo>/)
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".wasm": "application/wasm",
  ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png", ".ico": "image/x-icon",
};

// Minimal static server for dist-site, under the build's /kussetsu/ base.
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.startsWith(BASE_PREFIX)) p = p.slice(BASE_PREFIX.length) || "/";
    if (p === "/" || p.endsWith("/")) p += "index.html";
    const file = normalize(join(DIST, p));
    if (!file.startsWith(DIST)) return void res.writeHead(403).end();
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}${BASE_PREFIX}`;

let pass = 0,
  fail = 0;
const ok = (name, cond, detail) => {
  if (cond) pass++;
  else {
    fail++;
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`);
  }
};

// `channel: "chromium"` = the full Chromium (new headless) — the headless-shell has NO WebGPU.
// On Linux CI (no GPU) Dawn needs a software Vulkan driver (lavapipe / mesa-vulkan-drivers) selected
// via --use-angle=vulkan + --enable-features=Vulkan. On macOS/Windows that forcing BREAKS WebGPU
// (Metal/D3D, no Vulkan), so only pass it on Linux; --enable-unsafe-swiftshader is the CPU fallback.
const linuxArgs = ["--use-angle=vulkan", "--enable-features=Vulkan"];
const browser = await chromium.launch({
  channel: "chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", ...(process.platform === "linux" ? linuxArgs : [])],
});
const GPU_ERR = /uncaptured|wgsl|createRenderPipeline|createShaderModule|gpu-renderer (caught|uncaught)|is not a function|device lost/i;

// If this environment simply has no WebGPU adapter (a headless CI box with no GPU and no software
// Vulkan), SKIP rather than fail — the lane is a real gate locally / on a WebGPU-capable runner,
// and shouldn't go red just because the box can't do WebGPU at all.
const probe = await browser.newPage();
await probe.goto(base + "/", { waitUntil: "load" });
const hasGPU = await probe.evaluate(async () => {
  if (!navigator.gpu) return false;
  try {
    return !!(await navigator.gpu.requestAdapter());
  } catch {
    return false;
  }
});
await probe.close();
if (!hasGPU) {
  console.log("⚠ SKIPPED — no WebGPU adapter in this environment (headless box without a GPU / software Vulkan). Run locally or on a WebGPU-capable runner for full coverage.");
  await browser.close();
  server.close();
  process.exit(0);
}

// Smoke the marketing front door + the kitchen sink (exercises rects/text/glass/material/shadow/opacity/scroll).
for (const route of ["/", "/?kitchen"]) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  await page.goto(base + route, { waitUntil: "load" });
  await page.waitForSelector("canvas", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500); // let the first GPU frames run (createGpuRoot is async)

  ok(`${route} — a <canvas> is mounted`, await page.evaluate(() => !!document.querySelector("canvas")));
  ok(`${route} — did not fall back (createGpuRoot succeeded)`, !(await page.evaluate(() => document.body.innerText.includes("WebGPU-capable browser"))));

  const gpuErr = errors.find((e) => GPU_ERR.test(e));
  ok(`${route} — no GPU/shader errors on the console`, !gpuErr, gpuErr);

  await page.close();
}

await browser.close();
server.close();
console.log(`\n${fail === 0 ? "✓ ALL PASS" : "✗ FAILURES"} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
