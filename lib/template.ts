import fs from "node:fs";
import path from "node:path";

export type EcBrief = {
  // 基本情報
  shopName: string;
  shopNameEn: string;
  tagline: string; // 短いキャッチ
  subTagline: string; // 補足
  description: string; // メタディスクリプション
  // ブランド
  primaryColor: string; // メインカラー (CSS hex)
  accentColor: string; // アクセントカラー
  bloodColor: string; // 警告/danger 色
  darkMode: boolean;
  // ヒーロー動画
  heroVideoUrls: string[]; // 最大 6
  // 店舗情報
  address: string;
  hours: string;
  access: string;
  mapsQuery: string; // 地図埋め込み用クエリ (例: "新潟市中央区東大通1-3-20")
  // SNS
  instagramOfficial: string; // URL
  instagramDelivery: string; // URL
  // About
  aboutQuote: string; // メインの大文字
  aboutBody: string; // 説明文
  // ナビ表記
  navDeliveryLabel: string;
  // 取扱ブランド
  brands: string[];
  // FAQ
  faqs: { q: string; a: string }[];
  // 年齢確認
  ageGate: boolean;
  ageMin: number;
  // フッター
  copyrightLine: string;
};

export const DEFAULT_BRIEF: EcBrief = {
  shopName: "Neo+AID",
  shopNameEn: "NEO PLUS AID",
  tagline: "CHILL BEYOND THE LIMIT.",
  subTagline: "日本一ピースなCBDショップ。",
  description: "新潟駅から3分。日本一ピースなCBDショップ。Neo plus AID。",
  primaryColor: "#0a0a0a",
  accentColor: "#c5ff00",
  bloodColor: "#ff2d2d",
  darkMode: true,
  heroVideoUrls: [
    "https://cdn.shopify.com/videos/c/o/v/ba179035550d4870a8f6364ea65179ee.mp4",
    "https://cdn.shopify.com/videos/c/o/v/200276f068a247439eae4b463b924674.mp4",
    "https://cdn.shopify.com/videos/c/o/v/e00531824d344b9a8f8e58cfbfa54d6f.mp4",
    "https://cdn.shopify.com/videos/c/o/v/dbd8211a3c0043b696885b92996b1121.mp4",
    "https://cdn.shopify.com/videos/c/o/v/ee23d6d7fe8a43978cf6ade83b8f1b80.mp4",
    "https://cdn.shopify.com/videos/c/o/v/02739b1e76e24400a14edaddf5b58c70.mp4",
  ],
  address: "新潟市中央区東大通1-3-20 木村ビル1F",
  hours: "15:00 — 23:00 / EVERYDAY",
  access: "新潟駅 万代口より 徒歩3分",
  mapsQuery: "新潟市中央区東大通1-3-20",
  instagramOfficial: "https://www.instagram.com/neo_plusaid_official/",
  instagramDelivery: "https://www.instagram.com/neoplus_delivery/",
  aboutQuote: "日本一ピースなCBDショップ。新潟駅から徒歩3分。",
  aboutBody:
    "初めての方も、リピーターも。気軽に立ち寄れる cool chill な空間。スタッフが一人ひとりに合わせてご案内します。",
  navDeliveryLabel: "DELIVERY",
  brands: ["H4CBH", "HHBD", "CRDP", "ARBOL", "yongans", "+ more"],
  faqs: [
    { q: "初めてでも大丈夫？", a: "はい。スタッフが好み・体感・予算を伺った上でご案内します。20歳以上の方限定。" },
    { q: "支払い方法は？", a: "現金 / 各種クレジット / PayPay / 電子マネー対応。" },
    { q: "デリバリーは？", a: "新潟市内対応。Instagram DM までお問い合わせください。" },
  ],
  ageGate: true,
  ageMin: 20,
  copyrightLine: "NEO PLUS AID · NIIGATA · 20+ ONLY · ALL RIGHTS RESERVED",
};

/**
 * Build a flat key->value substitution map from a brief.
 * Tokens follow the pattern `__ECM_KEY__` inside seed files. We additionally
 * patch known Neo+AID literal strings in the seed so that ECMaker still works
 * even on files that haven't been tokenized yet.
 */
function literalPatches(b: EcBrief): Array<[RegExp | string, string]> {
  const patches: Array<[RegExp | string, string]> = [
    // 店舗情報
    ["新潟市中央区東大通1-3-20 木村ビル1F", b.address],
    ["新潟市中央区東大通1-3-20", b.mapsQuery],
    ["新潟駅 万代口より 徒歩3分", b.access],
    ["新潟駅から徒歩3分", b.access],
    ["新潟駅から3分", b.access],
    ["15:00 — 23:00 / EVERYDAY", b.hours],
    ["15:00 – 23:00", b.hours],
    // SNS
    ["https://www.instagram.com/neoplus_delivery/", b.instagramDelivery],
    ["https://www.instagram.com/neo_plusaid_official/", b.instagramOfficial],
    ["@neoplus_delivery", "@" + handleFromUrl(b.instagramDelivery, "delivery")],
    ["@neo_plusaid_official", "@" + handleFromUrl(b.instagramOfficial, "official")],
    // ブランド名
    ["NEO PLUS AID", b.shopNameEn],
    ["NEO+AID", b.shopName],
    ["Neo plus AID", b.shopName],
    ["Neo+AID", b.shopName],
    // タグライン
    ["CHILL BEYOND THE LIMIT.", b.tagline],
    ["日本一ピースなCBDショップ", b.subTagline.replace(/。$/, "")],
    [
      "新潟駅から徒歩3分。日本一ピースなCBDショップ「Neo plus AID」。",
      `${b.access}。${b.subTagline}「${b.shopName}」。`,
    ],
    // about
    ["初めての方も、リピーターも。気軽に立ち寄れる cool chill な空間。スタッフが一人ひとりに合わせてご案内します。", b.aboutBody],
    // age gate
    ["20歳以上対象 / FOR ADULTS ONLY · 観賞用商品を含む", `${b.ageMin}歳以上対象 / FOR ADULTS ONLY`],
    ["20+ ONLY", `${b.ageMin}+ ONLY`],
    // footer copyright (preserve {{ 'now' | date: '%Y' }})
    [
      "© {{ 'now' | date: '%Y' }} NEO PLUS AID · NIIGATA · 20+ ONLY · ALL RIGHTS RESERVED",
      `© {{ 'now' | date: '%Y' }} ${b.copyrightLine}`,
    ],
    // theme info
    [/"theme_name":\s*"Neo\+AID"/g, `"theme_name": ${JSON.stringify(b.shopName)}`],
    [/"theme_author":\s*"Neo\+AID"/g, `"theme_author": ${JSON.stringify(b.shopName)}`],
  ];
  return patches;
}

function handleFromUrl(url: string, fallback: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean)[0];
    return seg || fallback;
  } catch {
    return fallback;
  }
}

/** Apply hero video URL overrides into layout/theme.liquid defaults array. */
function patchHeroVideos(content: string, urls: string[]): string {
  const padded = [...urls];
  while (padded.length < 6) padded.push("");
  // Replace the literal defaults array
  const newArr = padded
    .map((u) => (u ? `      "${u.replace(/"/g, '\\"')}"` : `      ""`))
    .join(",\n");
  return content.replace(
    /var\s+defaults\s*=\s*\[[\s\S]*?\];/,
    `var defaults = [\n${newArr}\n    ];`,
  );
}

/** Patch the取り扱いブランド grid in templates/index.liquid */
function patchBrandsGrid(content: string, brands: string[]): string {
  const list = brands.length
    ? brands.map((b) => `        <span>${escapeHtml(b)}</span>`).join("\n")
    : `        <span>+ more</span>`;
  return content.replace(
    /(<div class="brands-grid">)[\s\S]*?(<\/div>)/,
    (_m, open, close) => `${open}\n${list}\n      ${close}`,
  );
}

/** Patch FAQ accordion */
function patchFaqs(content: string, faqs: { q: string; a: string }[]): string {
  if (!faqs.length) return content;
  const list = faqs
    .map(
      (f) =>
        `      <details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`,
    )
    .join("\n");
  return content.replace(
    /(<div class="faq">)[\s\S]*?(<\/div>)\s*<\/section>/,
    (_m, open) => `${open}\n${list}\n    </div>\n</section>`,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Patch CSS custom properties for brand colors in assets/theme.css */
function patchThemeCss(content: string, b: EcBrief): string {
  let out = content;
  // Replace --acid, --blood values in :root if present (simple replacement of first hex after token)
  out = out.replace(/(--acid\s*:\s*)#[0-9a-fA-F]{3,8}/g, `$1${b.accentColor}`);
  out = out.replace(/(--blood\s*:\s*)#[0-9a-fA-F]{3,8}/g, `$1${b.bloodColor}`);
  out = out.replace(/(--ink\s*:\s*)#[0-9a-fA-F]{3,8}/g, `$1${b.primaryColor}`);
  return out;
}

/** Patch settings_schema.json theme_info */
function patchSettingsSchema(content: string, b: EcBrief): string {
  try {
    const json = JSON.parse(content);
    for (const block of json) {
      if (block?.name === "theme_info") {
        block.theme_name = b.shopName;
        block.theme_author = b.shopName;
        block.theme_documentation_url = b.instagramOfficial || "";
        block.theme_support_url = b.instagramOfficial || "";
      }
    }
    return JSON.stringify(json, null, 2);
  } catch {
    return content;
  }
}

const TEXT_EXTS = new Set([
  ".liquid",
  ".json",
  ".css",
  ".js",
  ".html",
  ".md",
  ".txt",
  ".svg",
]);

function isTextFile(p: string): boolean {
  return TEXT_EXTS.has(path.extname(p).toLowerCase());
}

/** Recursively copy src -> dst, applying the brief to text files. */
export function renderThemeTree(
  srcDir: string,
  dstDir: string,
  b: EcBrief,
): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  const patches = literalPatches(b);

  const walk = (rel: string) => {
    const sAbs = path.join(srcDir, rel);
    const dAbs = path.join(dstDir, rel);
    const st = fs.statSync(sAbs);
    if (st.isDirectory()) {
      fs.mkdirSync(dAbs, { recursive: true });
      for (const entry of fs.readdirSync(sAbs)) {
        walk(path.join(rel, entry));
      }
      return;
    }
    fs.mkdirSync(path.dirname(dAbs), { recursive: true });
    if (isTextFile(sAbs)) {
      let content = fs.readFileSync(sAbs, "utf8");
      // 1) global literal patches
      for (const [from, to] of patches) {
        if (from instanceof RegExp) content = content.replace(from, to);
        else content = content.split(from).join(to);
      }
      // 2) per-file special patches
      const baseName = path.basename(sAbs);
      if (baseName === "theme.liquid") {
        content = patchHeroVideos(content, b.heroVideoUrls);
      }
      if (baseName === "index.liquid") {
        content = patchBrandsGrid(content, b.brands);
        content = patchFaqs(content, b.faqs);
      }
      if (baseName === "theme.css") {
        content = patchThemeCss(content, b);
      }
      if (baseName === "settings_schema.json") {
        content = patchSettingsSchema(content, b);
      }
      fs.writeFileSync(dAbs, content, "utf8");
      bytes += Buffer.byteLength(content);
    } else {
      fs.copyFileSync(sAbs, dAbs);
      bytes += st.size;
    }
    files += 1;
  };

  walk("");
  return { files, bytes };
}
