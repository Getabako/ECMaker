#!/usr/bin/env node
/**
 * EC Maker — local web UI for the Shopify-theme generator.
 * Boots the bundled Next.js standalone server and opens the browser.
 *
 * Unlike LP Maker, this tool does NOT require the Codex CLI — it is a pure
 * template-substitution engine that emits a Shopify-compatible zip.
 */
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const net = require("node:net");

const PKG_ROOT = path.resolve(__dirname, "..");
const STANDALONE = path.join(PKG_ROOT, ".next", "standalone", "server.js");

function pickPort(start) {
  return new Promise((resolve) => {
    const try1 = (p) => {
      const srv = net.createServer();
      srv.once("error", () => try1(p + 1));
      srv.listen(p, "127.0.0.1", () => {
        const port = srv.address().port;
        srv.close(() => resolve(port));
      });
    };
    try1(start);
  });
}

(async () => {
  if (!fs.existsSync(STANDALONE)) {
    console.error(
      `✗ ビルド成果物が見つかりません: ${STANDALONE}\n` +
        "  リポジトリ直下で `pnpm build` または `npm run build` を実行してください。",
    );
    process.exit(1);
  }

  // Default to 4577 to avoid colliding with LPMaker (4567) and other tools.
  const port = await pickPort(Number(process.env.PORT) || 4577);
  const url = `http://localhost:${port}`;

  // Sync static + public + templates into the standalone dir so the running
  // server can resolve them via process.cwd().
  const standaloneDir = path.dirname(STANDALONE);

  const staticSrc = path.join(PKG_ROOT, ".next", "static");
  const staticDst = path.join(standaloneDir, ".next", "static");
  if (fs.existsSync(staticSrc)) {
    fs.rmSync(staticDst, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(staticDst), { recursive: true });
    fs.cpSync(staticSrc, staticDst, { recursive: true });
  }
  const publicSrc = path.join(PKG_ROOT, "public");
  const publicDst = path.join(standaloneDir, "public");
  if (fs.existsSync(publicSrc)) {
    fs.rmSync(publicDst, { recursive: true, force: true });
    fs.cpSync(publicSrc, publicDst, { recursive: true });
  }
  // Critical: copy the templates/ directory so paths.shopifyTemplateDir() can
  // resolve it relative to the standalone cwd.
  const templatesSrc = path.join(PKG_ROOT, "templates");
  const templatesDst = path.join(standaloneDir, "templates");
  if (fs.existsSync(templatesSrc)) {
    fs.rmSync(templatesDst, { recursive: true, force: true });
    fs.cpSync(templatesSrc, templatesDst, { recursive: true });
  }

  console.log("");
  console.log("=".repeat(56));
  console.log(`  ▶ EC Maker 起動完了`);
  console.log(`  ▶ ブラウザで開く:  ${url}`);
  console.log(`  ▶ 終了するには:    Ctrl+C`);
  console.log("=".repeat(56));
  console.log("");

  const child = spawn(process.execPath, [STANDALONE], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      ECMAKER_TEMPLATE_DIR: path.join(templatesDst, "shopify"),
    },
    stdio: "inherit",
  });

  const shutdown = () => {
    try {
      child.kill("SIGTERM");
    } catch {}
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  child.on("exit", (code) => process.exit(code ?? 0));
})();
