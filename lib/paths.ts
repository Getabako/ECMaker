import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const ROOT =
  process.env.ECMAKER_DATA_ROOT ?? path.join(os.homedir(), ".ecmaker-data");

export const paths = {
  root: ROOT,
  generated: path.join(ROOT, "generated"),
  projectDir(id: string) {
    return path.join(ROOT, "generated", id);
  },
};

export function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export function newId(): string {
  const ts = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "-");
  const rnd = Math.random().toString(36).slice(2, 6);
  return `${ts}-${rnd}`;
}

/**
 * Locate the bundled Shopify seed template directory.
 *
 * In dev: CodexAppServer/ECMaker/templates/shopify
 * In standalone build (.next/standalone/...): the bin/cli.js copies the
 * `templates/` folder next to server.js, so process.cwd()/templates/shopify
 * resolves.
 */
export function shopifyTemplateDir(): string {
  const candidates = [
    process.env.ECMAKER_TEMPLATE_DIR,
    path.resolve(process.cwd(), "templates", "shopify"),
    path.resolve(__dirname, "..", "..", "templates", "shopify"),
    path.resolve(__dirname, "..", "..", "..", "templates", "shopify"),
    path.resolve(__dirname, "..", "..", "..", "..", "templates", "shopify"),
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isDirectory()) return c;
    } catch {}
  }
  throw new Error(
    "Shopify テンプレート (templates/shopify) が見つかりません。ECMAKER_TEMPLATE_DIR を設定してください。",
  );
}
