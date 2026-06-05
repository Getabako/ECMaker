import fs from "node:fs";
import path from "node:path";

/**
 * EcBrief — the form payload for the ECMaker generic Shopify theme.
 *
 * Editing model: ALL editing happens in ECMaker. The Shopify side is "upload
 * zip → publish". So instead of writing merchant copy into
 * config/settings_data.json (which would expose it via the Shopify customize
 * panel), the render engine walks the seed tree and substitutes safe sentinel
 * placeholders (e.g. __ECM_SHOP_NAME__) directly into the Liquid / CSS / JS.
 * settings_schema.json is left minimal — the merchant never touches the
 * customize panel.
 */
export type HeroType = "image" | "slider" | "video-single" | "video-multi";

export type EcBrief = {
  // ===== Brand =====
  shopName: string;
  shopTagline: string;
  description: string;
  accentColor: string;

  // ===== Hero =====
  heroType: HeroType;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroCtaPrimaryLabel: string;
  heroCtaPrimaryUrl: string;
  heroCtaSecondaryLabel: string;
  heroCtaSecondaryUrl: string;
  // image (single)
  heroImageUrl: string;
  // slider (up to 6)
  heroSliderImages: string[];
  heroSliderIntervalSec: number;
  // video — single OR multi (up to 6)
  heroVideoUrls: string[];

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

  heroType: "image",
  heroEyebrow: "",
  heroHeadline: "Welcome to My Shop",
  heroSubtitle: "厳選した商品をお届けします。",
  heroCtaPrimaryLabel: "Shop Now",
  heroCtaPrimaryUrl: "",
  heroCtaSecondaryLabel: "About",
  heroCtaSecondaryUrl: "/pages/about",
  heroImageUrl: "",
  heroSliderImages: ["", "", "", "", "", ""],
  heroSliderIntervalSec: 6,
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

// ---------- sentinel substitution ----------

/** Generic stock-image placeholder when the user leaves hero image blank. */
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80";

/** Escape for inclusion as a Liquid string literal / HTML attribute. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** JSON string literal (used for JS / inline JSON blocks). */
function jsonStr(s: string): string {
  return JSON.stringify(s);
}

/**
 * Build the sentinel → replacement map from a brief.
 *
 * Sentinel naming: __ECM_<UPPER_SNAKE>__
 */
function buildSentinels(b: EcBrief): Record<string, string> {
  const shopName = b.shopName.trim() || "My Shop";
  const heroHeadline = b.heroHeadline.trim() || shopName;
  const heroImg = b.heroImageUrl.trim() || DEFAULT_HERO_IMAGE;
  const ctaPrimaryUrl = b.heroCtaPrimaryUrl.trim() || "/collections/all";
  const ctaSecondaryUrl = b.heroCtaSecondaryUrl.trim() || "/pages/about";

  const sliderImages = b.heroSliderImages.map((s) => s.trim()).filter(Boolean);
  const sliderImagesEffective =
    sliderImages.length > 0 ? sliderImages : [heroImg];

  const videoUrls = b.heroVideoUrls.map((s) => s.trim()).filter(Boolean);

  const brandsList = b.brands.map((s) => s.trim()).filter(Boolean);
  const faqs = b.faqs.filter((f) => f.q.trim() && f.a.trim());

  return {
    // Brand
    "__ECM_SHOP_NAME__": shopName,
    "__ECM_SHOP_NAME_ESC__": esc(shopName),
    "__ECM_SHOP_TAGLINE__": b.shopTagline,
    "__ECM_SHOP_DESCRIPTION__": b.description,
    "__ECM_ACCENT_COLOR__": b.accentColor || "#1a3a5c",
    "__ECM_COPYRIGHT_LINE__": b.copyrightLine.trim() || shopName,

    // Hero type (used in {% if %} conditionals as a Liquid string)
    "__ECM_HERO_TYPE__": b.heroType,

    // Hero copy
    "__ECM_HERO_EYEBROW__": b.heroEyebrow,
    "__ECM_HERO_HEADLINE__": heroHeadline,
    "__ECM_HERO_SUBTITLE__": b.heroSubtitle,
    "__ECM_HERO_CTA_PRIMARY_LABEL__":
      b.heroCtaPrimaryLabel.trim() || "Shop Now",
    "__ECM_HERO_CTA_PRIMARY_URL__": ctaPrimaryUrl,
    "__ECM_HERO_CTA_SECONDARY_LABEL__": b.heroCtaSecondaryLabel,
    "__ECM_HERO_CTA_SECONDARY_URL__": ctaSecondaryUrl,

    // Hero image (single)
    "__ECM_HERO_IMAGE_URL__": heroImg,

    // Hero slider — JSON array literal for JS
    "__ECM_HERO_SLIDER_JSON__": JSON.stringify(sliderImagesEffective),
    "__ECM_HERO_SLIDER_FIRST__": sliderImagesEffective[0] || heroImg,
    "__ECM_HERO_SLIDER_INTERVAL_MS__": String(
      Math.max(2, b.heroSliderIntervalSec || 6) * 1000,
    ),

    // Hero video — JSON array literal for JS
    "__ECM_HERO_VIDEO_JSON__": JSON.stringify(videoUrls),
    "__ECM_HERO_VIDEO_FIRST__": videoUrls[0] || "",
    "__ECM_HERO_VIDEO_COUNT__": String(videoUrls.length),

    // Sections
    "__ECM_PRODUCTS_TITLE__":
      b.productsSectionTitle.trim() || "Products",
    "__ECM_PRODUCTS_SUBTITLE__": b.productsSectionSubtitle,

    "__ECM_BRANDS_TITLE__": b.brandsSectionTitle.trim() || "Brands",
    "__ECM_BRANDS_JSON__": JSON.stringify(brandsList),

    "__ECM_ABOUT_TITLE__": b.aboutSectionTitle.trim() || "About",
    "__ECM_ABOUT_QUOTE__": b.aboutQuote,
    "__ECM_ABOUT_BODY__": b.aboutBody,
    "__ECM_STORE_ADDRESS__": b.storeAddress,
    "__ECM_STORE_HOURS__": b.storeHours,
    "__ECM_STORE_ACCESS__": b.storeAccess,
    "__ECM_STORE_MAPS_QUERY__": b.storeMapsQuery,
    "__ECM_FAQS_JSON__": JSON.stringify(faqs),

    "__ECM_SOCIAL_TITLE__": b.socialSectionTitle.trim() || "Follow Us",
    "__ECM_INSTAGRAM_OFFICIAL__": b.instagramOfficial,
    "__ECM_INSTAGRAM_OFFICIAL_HANDLE__": b.instagramOfficialHandle,
    "__ECM_INSTAGRAM_SECONDARY__": b.instagramSecondary,
    "__ECM_INSTAGRAM_SECONDARY_HANDLE__": b.instagramSecondaryHandle,
  };
}

/** Apply sentinel substitution to a text payload. */
function applySentinels(content: string, map: Record<string, string>): string {
  let out = content;
  for (const [k, v] of Object.entries(map)) {
    if (out.includes(k)) {
      out = out.split(k).join(v);
    }
  }
  return out;
}

// settings_schema.json is left as-is in the seed (intentionally minimal).
// We still rewrite theme_info so the theme name reflects the shop.
function patchSettingsSchema(content: string, b: EcBrief): string {
  try {
    const json = JSON.parse(content);
    if (Array.isArray(json)) {
      for (const block of json) {
        if (block?.name === "theme_info") {
          block.theme_name = b.shopName || block.theme_name;
          block.theme_author = b.shopName || block.theme_author;
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

/** Recursively copy src -> dst, applying sentinel substitution per file. */
export function renderThemeTree(
  srcDir: string,
  dstDir: string,
  b: EcBrief,
): { files: number; bytes: number } {
  const sentinels = buildSentinels(b);
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
      // Sentinel substitution first
      content = applySentinels(content, sentinels);
      // settings_schema gets a tiny structural tweak so the theme shows up
      // in Shopify admin under the shop's name.
      if (relPosix === "config/settings_schema.json") {
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
  // Silence the unused warning for sentinels in tools that don't recognise it.
  void jsonStr;
  return { files, bytes };
}
