import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { paths } from "@/lib/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!/^[\w-]+$/.test(id)) {
    return new Response("bad id", { status: 400 });
  }
  const projectDir = paths.projectDir(id);
  const themeDir = path.join(projectDir, "theme");
  if (!fs.existsSync(themeDir)) {
    return new Response("not found", { status: 404 });
  }

  let shopName = "shopify-theme";
  try {
    const brief = JSON.parse(
      fs.readFileSync(path.join(projectDir, "_brief.json"), "utf8"),
    );
    if (brief?.shopName) shopName = String(brief.shopName);
  } catch {}

  const zip = new AdmZip();
  // Shopify expects the theme directories (layout/, templates/, sections/,
  // snippets/, assets/, config/, locales/) at the root of the zip — NOT
  // wrapped in a parent folder. So add the contents of themeDir directly.
  for (const entry of fs.readdirSync(themeDir)) {
    const abs = path.join(themeDir, entry);
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      zip.addLocalFolder(abs, entry);
    } else {
      zip.addLocalFile(abs);
    }
  }

  const buf = zip.toBuffer();
  const safeName =
    shopName.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") ||
    "shopify-theme";
  return new Response(buf, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}-${id}.zip"`,
      "Cache-Control": "no-store",
      "Content-Length": String(buf.length),
    },
  });
}
