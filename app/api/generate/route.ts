import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { paths, ensureDir, newId, shopifyTemplateDir } from "@/lib/paths";
import { EcBrief, renderThemeTree } from "@/lib/template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { brief: EcBrief };

export async function POST(req: NextRequest) {
  const { brief } = (await req.json()) as Body;
  if (!brief || !brief.shopName?.trim()) {
    return new Response("brief.shopName required", { status: 400 });
  }

  const id = newId();
  const projectDir = paths.projectDir(id);
  const themeDir = path.join(projectDir, "theme");
  ensureDir(projectDir);
  ensureDir(themeDir);

  fs.writeFileSync(
    path.join(projectDir, "_brief.json"),
    JSON.stringify(brief, null, 2),
  );

  const seedDir = shopifyTemplateDir();

  try {
    const { files, bytes } = renderThemeTree(seedDir, themeDir, brief);
    fs.writeFileSync(
      path.join(projectDir, "_summary.json"),
      JSON.stringify(
        {
          shopName: brief.shopName,
          files,
          bytes,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    return Response.json({
      id,
      files,
      bytes,
      downloadUrl: `/api/download/${id}`,
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
