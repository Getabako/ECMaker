import fs from "node:fs";
import path from "node:path";

/**
 * EcBrief — the form payload for the ECMaker generic Shopify theme.
 *
 * The seed at templates/shopify/ is a neutral, mainstream Shopify Online
 * Store 2.0 theme. Everything store-specific is fed in through the brief
 * and applied to a small number of well-known files (mainly the layout,
 * the index template, and the settings schema/data). Plain Shopify
 * settings (logo, accent color, hero videos, etc.) are persisted into
 * config/settings_data.json so the merchant can keep editing them in the
 * Shopify admin without re-running ECMaker.
 */
export type EcBrief = {
  // ===== Brand =====
  shopName: string;
  shopTagline: string;
  description: string;
  accentColor: string;

  // ===== Hero =====
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroCtaPrimaryLabel: string;
  heroCtaPrimaryUrl: string;
  heroCtaSecondaryLabel: string;
  heroCtaSecondaryUrl: string;
  heroVideoUrls: string[]; // up to 6

  // ===== Products section =====
  productsSectionTitle: string;
  productsSectionSubtitle: string;

  // ===== Brands =====
  brandsSectionTitle: string;
  brands: string[];

  // ===== About / Store =====
  aboutSectionTitle: string;
  aboutQuote: string;
  aboutBody: string;
  storeAddress: string;
  storeHours: string;
  storeAccess: string;
  storeMapsQuery: string;
  faqs: { q: string; a: string }[];

  // ===== Social =====
  socialSectionTitle: string;
  instagramOfficial: string;
  instagramOfficialHandle: string;
  instagramSecondary: string;
  instagramSecondaryHandle: string;

  // ===== Footer =====
  copyrightLine: string;
};

export const DEFAULT_BRIEF: EcBrief = {
  shopName: "My Shop",
  shopTagline: "",
  description: "",
  accentColor: "#1a3a5c",

  heroEyebrow: "",
  heroHeadline: "Welcome to My Shop",
  heroSubtitle: "厳選した商品をお届けします。",
  heroCtaPrimaryLabel: "Shop Now",
  heroCtaPrimaryUrl: "",
  heroCtaSecondaryLabel: "About",
  heroCtaSecondaryUrl: "/pages/about",
  heroVideoUrls: ["", "", "", "", "", ""],

  productsSectionTitle: "Products",
  productsSectionSubtitle: "",

  brandsSectionTitle: "Brands",
  brands: [],

  aboutSectionTitle: "About",
  aboutQuote: "",
  aboutBody: "",
  storeAddress: "",
  storeHours: "",
  storeAccess: "",
  storeMapsQuery: "",
  faqs: [],

  socialSectionTitle: "Follow Us",
  instagramOfficial: "",
  instagramOfficialHandle: "",
  instagramSecondary: "",
  instagramSecondaryHandle: "",

  copyrightLine: "",
};

// ---------- per-file patches ----------

/** Patch settings_data.json — write all brand-level settings into the Default
 *  preset so they appear in Shopify admin without further config. */
function patchSettingsData(content: string, b: EcBrief): string {
  let data: { current: string; presets: Record<string, Record<string, unknown>> };
  try {
    data = JSON.parse(content);
  } catch {
    data = { current: "Default", presets: { Default: {} } };
  }
  if (!data.presets) data.presets = { Default: {} };
  if (!data.presets.Default) data.presets.Default = {};

  const brandsList = b.brands.filter((s) => s.trim()).join(", ");
  const faqList = b.faqs
    .filter((f) => f.q.trim() && f.a.trim())
    .map((f) => `${f.q.trim()} :: ${f.a.trim()}`)
    .join(" | ");

  const settings: Record<string, unknown> = {
    accent_color: b.accentColor,
    shop_tagline: b.shopTagline,
    shop_description: b.description,
    hero_eyebrow: b.heroEyebrow,
    hero_headline: b.heroHeadline,
    hero_subtitle: b.heroSubtitle,
    hero_cta_primary_label: b.heroCtaPrimaryLabel,
    hero_cta_primary_url: b.heroCtaPrimaryUrl,
    hero_cta_secondary_label: b.heroCtaSecondaryLabel,
    hero_cta_secondary_url: b.heroCtaSecondaryUrl,
    hero_video_url_1: b.heroVideoUrls[0] || "",
    hero_video_url_2: b.heroVideoUrls[1] || "",
    hero_video_url_3: b.heroVideoUrls[2] || "",
    hero_video_url_4: b.heroVideoUrls[3] || "",
    hero_video_url_5: b.heroVideoUrls[4] || "",
    hero_video_url_6: b.heroVideoUrls[5] || "",
    products_section_title: b.productsSectionTitle,
    products_section_subtitle: b.productsSectionSubtitle,
    brands_section_title: b.brandsSectionTitle,
    brands_list: brandsList,
    about_section_title: b.aboutSectionTitle,
    about_quote: b.aboutQuote,
    about_body: b.aboutBody,
    store_address: b.storeAddress,
    store_hours: b.storeHours,
    store_access: b.storeAccess,
    store_maps_query: b.storeMapsQuery,
    faq_list: faqList,
    social_section_title: b.socialSectionTitle,
    instagram_official: b.instagramOfficial,
    instagram_official_handle: b.instagramOfficialHandle,
    instagram_secondary: b.instagramSecondary,
    instagram_secondary_handle: b.instagramSecondaryHandle,
    copyright_line: b.copyrightLine || b.shopName,
  };

  data.presets.Default = {
    ...(data.presets.Default || {}),
    ...settings,
  };
  return JSON.stringify(data, null, 2);
}

/** Patch settings_schema.json — replace the theme_info block so the theme
 *  shows up in Shopify admin under the shop's own name. */
function patchSettingsSchema(content: string, b: EcBrief): string {
  try {
    const json = JSON.parse(content);
    if (Array.isArray(json)) {
      for (const block of json) {
        if (block?.name === "theme_info") {
          block.theme_name = b.shopName;
          block.theme_author = b.shopName;
        }
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

/** Recursively copy src -> dst, applying the brief to known config files. */
export function renderThemeTree(
  srcDir: string,
  dstDir: string,
  b: EcBrief,
): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;

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
      const relPosix = rel.split(path.sep).join("/");
      if (relPosix === "config/settings_data.json") {
        content = patchSettingsData(content, b);
      } else if (relPosix === "config/settings_schema.json") {
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
