"use client";

import { useState } from "react";

type Faq = { q: string; a: string };

type Brief = {
  shopName: string;
  shopTagline: string;
  description: string;
  accentColor: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroCtaPrimaryLabel: string;
  heroCtaPrimaryUrl: string;
  heroCtaSecondaryLabel: string;
  heroCtaSecondaryUrl: string;
  heroVideoUrls: string[];
  productsSectionTitle: string;
  productsSectionSubtitle: string;
  brandsSectionTitle: string;
  brands: string[];
  aboutSectionTitle: string;
  aboutQuote: string;
  aboutBody: string;
  storeAddress: string;
  storeHours: string;
  storeAccess: string;
  storeMapsQuery: string;
  faqs: Faq[];
  socialSectionTitle: string;
  instagramOfficial: string;
  instagramOfficialHandle: string;
  instagramSecondary: string;
  instagramSecondaryHandle: string;
  copyrightLine: string;
};

const INITIAL: Brief = {
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

type Phase = "form" | "generating" | "done";

const input =
  "w-full bg-white border border-stone-300 rounded-xl px-4 py-3 text-base leading-relaxed text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 shadow-sm";

export default function Home() {
  const [brief, setBrief] = useState<Brief>(INITIAL);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ files: number; bytes: number } | null>(null);

  const updateBrand = (i: number, v: string) => {
    const next = [...brief.brands];
    next[i] = v;
    setBrief({ ...brief, brands: next });
  };
  const addBrand = () => setBrief({ ...brief, brands: [...brief.brands, ""] });
  const removeBrand = (i: number) =>
    setBrief({ ...brief, brands: brief.brands.filter((_, idx) => idx !== i) });

  const updateFaq = (i: number, key: "q" | "a", v: string) => {
    const next = [...brief.faqs];
    next[i] = { ...next[i], [key]: v };
    setBrief({ ...brief, faqs: next });
  };
  const addFaq = () => setBrief({ ...brief, faqs: [...brief.faqs, { q: "", a: "" }] });
  const removeFaq = (i: number) =>
    setBrief({ ...brief, faqs: brief.faqs.filter((_, idx) => idx !== i) });

  const updateVideo = (i: number, v: string) => {
    const next = [...brief.heroVideoUrls];
    next[i] = v;
    setBrief({ ...brief, heroVideoUrls: next });
  };

  const submit = async () => {
    setPhase("generating");
    setError(null);
    setResultId(null);
    setSummary(null);

    const cleaned: Brief = {
      ...brief,
      brands: brief.brands.map((s) => s.trim()).filter(Boolean),
      faqs: brief.faqs.filter((f) => f.q.trim() && f.a.trim()),
      heroVideoUrls: brief.heroVideoUrls.map((s) => s.trim()),
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成に失敗しました");
        setPhase("form");
        return;
      }
      setResultId(data.id);
      setSummary({ files: data.files, bytes: data.bytes });
      setPhase("done");
    } catch (e) {
      setError((e as Error).message);
      setPhase("form");
    }
  };

  if (phase === "done" && resultId) {
    return (
      <ResultView
        id={resultId}
        summary={summary}
        shopName={brief.shopName}
        onReset={() => setPhase("form")}
      />
    );
  }

  return (
    <main className="min-h-screen text-stone-800">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <SectionTitle title="EC Maker" subtitle="Shopify テーマ自動生成室 / Online Store 2.0 対応" />

        {phase === "generating" && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 p-8 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-700 mb-3">テーマを組み立て中…</div>
            <p className="text-stone-600">Shopify 用の zip を生成しています。数秒お待ちください。</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border-2 border-red-300 p-4 text-red-700">
            エラー: {error}
          </div>
        )}

        <Card title="店舗の基本情報" badge="Shop">
          <Field label="店舗名">
            <input
              className={input}
              value={brief.shopName}
              onChange={(e) => setBrief({ ...brief, shopName: e.target.value })}
              placeholder="My Shop"
            />
          </Field>
          <Field label="ショップタグライン（ブラウザタブ用、任意）">
            <input
              className={input}
              value={brief.shopTagline}
              onChange={(e) => setBrief({ ...brief, shopTagline: e.target.value })}
            />
          </Field>
          <Field label="メタディスクリプション（SEO 用）">
            <textarea
              className={input}
              rows={2}
              value={brief.description}
              onChange={(e) => setBrief({ ...brief, description: e.target.value })}
            />
          </Field>
          <ColorField
            label="アクセントカラー"
            value={brief.accentColor}
            onChange={(v) => setBrief({ ...brief, accentColor: v })}
          />
        </Card>

        <Card title="ヒーロー" badge="Hero">
          <Field label="ヒーロー上の小見出し（任意）">
            <input
              className={input}
              value={brief.heroEyebrow}
              onChange={(e) => setBrief({ ...brief, heroEyebrow: e.target.value })}
              placeholder="EST. 2024"
            />
          </Field>
          <Field label="ヒーロー大見出し">
            <input
              className={input}
              value={brief.heroHeadline}
              onChange={(e) => setBrief({ ...brief, heroHeadline: e.target.value })}
              placeholder="Welcome to My Shop"
            />
          </Field>
          <Field label="ヒーローサブタイトル">
            <textarea
              className={input}
              rows={2}
              value={brief.heroSubtitle}
              onChange={(e) => setBrief({ ...brief, heroSubtitle: e.target.value })}
            />
          </Field>
          <Row>
            <Field label="メイン CTA ラベル">
              <input
                className={input}
                value={brief.heroCtaPrimaryLabel}
                onChange={(e) => setBrief({ ...brief, heroCtaPrimaryLabel: e.target.value })}
              />
            </Field>
            <Field label="メイン CTA リンク（任意。空なら /collections/all）">
              <input
                className={input + " font-mono text-sm"}
                value={brief.heroCtaPrimaryUrl}
                onChange={(e) => setBrief({ ...brief, heroCtaPrimaryUrl: e.target.value })}
                placeholder="/collections/all"
              />
            </Field>
          </Row>
          <Row>
            <Field label="サブ CTA ラベル（任意）">
              <input
                className={input}
                value={brief.heroCtaSecondaryLabel}
                onChange={(e) => setBrief({ ...brief, heroCtaSecondaryLabel: e.target.value })}
              />
            </Field>
            <Field label="サブ CTA リンク">
              <input
                className={input + " font-mono text-sm"}
                value={brief.heroCtaSecondaryUrl}
                onChange={(e) => setBrief({ ...brief, heroCtaSecondaryUrl: e.target.value })}
                placeholder="/pages/about"
              />
            </Field>
          </Row>
        </Card>

        <Card title="ヒーロー動画 URL（最大 6 本・任意）" badge="Hero Videos">
          <p className="text-sm text-stone-500 -mt-1">
            Shopify「コンテンツ → ファイル」にアップした mp4 の URL を貼ってください。全部空欄でも OK（その場合ヒーローはタイトルのみ表示・黒背景）。複数本入れると最後まで再生されたら次の動画にサークル状にワイプ切り替えします。音声は常にミュートです。
          </p>
          <div className="grid grid-cols-1 gap-2">
            {brief.heroVideoUrls.map((u, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-8 text-stone-500 text-sm">{i + 1}.</span>
                <input
                  className={input + " font-mono text-sm"}
                  value={u}
                  onChange={(e) => updateVideo(i, e.target.value)}
                  placeholder="https://cdn.shopify.com/videos/c/o/v/xxxxx.mp4"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card title="商品セクション" badge="Products">
          <Field label="セクションタイトル">
            <input
              className={input}
              value={brief.productsSectionTitle}
              onChange={(e) => setBrief({ ...brief, productsSectionTitle: e.target.value })}
            />
          </Field>
          <Field label="セクションサブタイトル（任意）">
            <textarea
              className={input}
              rows={2}
              value={brief.productsSectionSubtitle}
              onChange={(e) => setBrief({ ...brief, productsSectionSubtitle: e.target.value })}
            />
          </Field>
        </Card>

        <Card title="ブランド（任意）" badge="Brands">
          <Field label="セクションタイトル">
            <input
              className={input}
              value={brief.brandsSectionTitle}
              onChange={(e) => setBrief({ ...brief, brandsSectionTitle: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {brief.brands.map((b, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  className={input}
                  value={b}
                  onChange={(e) => updateBrand(i, e.target.value)}
                  placeholder="ブランド名"
                />
                <button onClick={() => removeBrand(i)} className="text-red-500 px-2" title="削除">×</button>
              </div>
            ))}
          </div>
          <button onClick={addBrand} className="mt-2 text-sm text-orange-600 underline">
            + ブランドを追加
          </button>
        </Card>

        <Card title="ABOUT / 店舗情報" badge="About">
          <Field label="セクションタイトル">
            <input
              className={input}
              value={brief.aboutSectionTitle}
              onChange={(e) => setBrief({ ...brief, aboutSectionTitle: e.target.value })}
            />
          </Field>
          <Field label="大見出し（ABOUT の太字キャッチ）">
            <textarea
              className={input}
              rows={2}
              value={brief.aboutQuote}
              onChange={(e) => setBrief({ ...brief, aboutQuote: e.target.value })}
            />
          </Field>
          <Field label="本文">
            <textarea
              className={input}
              rows={3}
              value={brief.aboutBody}
              onChange={(e) => setBrief({ ...brief, aboutBody: e.target.value })}
            />
          </Field>
          <Field label="住所">
            <input
              className={input}
              value={brief.storeAddress}
              onChange={(e) => setBrief({ ...brief, storeAddress: e.target.value })}
            />
          </Field>
          <Field label="営業時間">
            <input
              className={input}
              value={brief.storeHours}
              onChange={(e) => setBrief({ ...brief, storeHours: e.target.value })}
            />
          </Field>
          <Field label="アクセス">
            <input
              className={input}
              value={brief.storeAccess}
              onChange={(e) => setBrief({ ...brief, storeAccess: e.target.value })}
            />
          </Field>
          <Field label="地図検索クエリ（Google Maps 用、任意）" hint="iframe 埋め込みと『道順』ボタンに使います。住所そのままで OK。">
            <input
              className={input}
              value={brief.storeMapsQuery}
              onChange={(e) => setBrief({ ...brief, storeMapsQuery: e.target.value })}
            />
          </Field>
        </Card>

        <Card title="FAQ（任意）" badge="FAQ">
          <div className="space-y-3">
            {brief.faqs.map((f, i) => (
              <div key={i} className="rounded-xl bg-stone-50 border border-stone-300 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className={input}
                    value={f.q}
                    onChange={(e) => updateFaq(i, "q", e.target.value)}
                    placeholder="質問"
                  />
                  <button onClick={() => removeFaq(i)} className="text-red-500 px-2" title="削除">×</button>
                </div>
                <textarea
                  className={input}
                  rows={2}
                  value={f.a}
                  onChange={(e) => updateFaq(i, "a", e.target.value)}
                  placeholder="回答"
                />
              </div>
            ))}
          </div>
          <button onClick={addFaq} className="mt-2 text-sm text-orange-600 underline">
            + FAQ を追加
          </button>
        </Card>

        <Card title="SNS（任意）" badge="Social">
          <Field label="セクションタイトル">
            <input
              className={input}
              value={brief.socialSectionTitle}
              onChange={(e) => setBrief({ ...brief, socialSectionTitle: e.target.value })}
            />
          </Field>
          <Row>
            <Field label="Instagram（公式）URL">
              <input
                className={input + " font-mono text-sm"}
                value={brief.instagramOfficial}
                onChange={(e) => setBrief({ ...brief, instagramOfficial: e.target.value })}
                placeholder="https://www.instagram.com/your_handle/"
              />
            </Field>
            <Field label="Instagram（公式）ハンドル表示">
              <input
                className={input}
                value={brief.instagramOfficialHandle}
                onChange={(e) => setBrief({ ...brief, instagramOfficialHandle: e.target.value })}
                placeholder="@your_handle"
              />
            </Field>
          </Row>
          <Row>
            <Field label="Instagram（サブ）URL">
              <input
                className={input + " font-mono text-sm"}
                value={brief.instagramSecondary}
                onChange={(e) => setBrief({ ...brief, instagramSecondary: e.target.value })}
              />
            </Field>
            <Field label="Instagram（サブ）ハンドル表示">
              <input
                className={input}
                value={brief.instagramSecondaryHandle}
                onChange={(e) => setBrief({ ...brief, instagramSecondaryHandle: e.target.value })}
              />
            </Field>
          </Row>
        </Card>

        <Card title="フッター" badge="Footer">
          <Field label="コピーライト行（空なら店舗名）">
            <input
              className={input}
              value={brief.copyrightLine}
              onChange={(e) => setBrief({ ...brief, copyrightLine: e.target.value })}
            />
          </Field>
        </Card>

        <div className="flex justify-end pt-2">
          <button
            onClick={submit}
            disabled={phase === "generating" || !brief.shopName.trim()}
            className="px-8 py-4 rounded-full text-lg font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:from-stone-300 disabled:to-stone-300 disabled:text-stone-500 shadow-md"
          >
            {phase === "generating" ? "生成中…" : "Shopify テーマ zip を生成"}
          </button>
        </div>
      </div>
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="w-full bg-white/80 backdrop-blur border-b border-stone-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold tracking-wider text-sm">
            EC
          </div>
          <span className="font-bold tracking-wide text-stone-800">EC Maker</span>
        </div>
        <span className="px-4 py-1.5 rounded-full text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium shadow-sm">
          Ashura
        </span>
      </div>
    </header>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pb-4 border-b border-stone-200/70">
      <h1 className="text-3xl font-bold tracking-wide text-orange-600">{title}</h1>
      <p className="text-base text-stone-500">{subtitle}</p>
    </div>
  );
}

function Card({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <section className="relative rounded-3xl bg-white/85 backdrop-blur border border-stone-200 shadow-md overflow-hidden">
      <div aria-hidden className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-red-500" />
      <div className="p-6 pl-7 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-dashed border-orange-200">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-sm">
            {badge}
          </span>
          <h2 className="text-xl font-extrabold tracking-wide text-stone-900">{title}</h2>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-base font-semibold text-stone-800">{label}</span>
      {hint && <span className="block text-sm text-stone-500">{hint}</span>}
      {children}
    </label>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-14 rounded-lg border border-stone-300 bg-white cursor-pointer"
        />
        <input className={input + " font-mono text-sm"} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

function ResultView({
  id,
  summary,
  shopName,
  onReset,
}: {
  id: string;
  summary: { files: number; bytes: number } | null;
  shopName: string;
  onReset: () => void;
}) {
  return (
    <main className="min-h-screen text-stone-800">
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-6 text-center">
        <h1 className="text-4xl font-bold text-orange-600">テーマが完成したぞ</h1>
        <p className="text-lg text-stone-600">
          <b>{shopName}</b> の Shopify テーマ zip を生成しました。
          {summary && (
            <span className="block text-sm text-stone-500 mt-2">
              {summary.files} ファイル / {(summary.bytes / 1024).toFixed(1)} KB
            </span>
          )}
        </p>

        <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-6 text-left text-sm text-stone-700 space-y-2">
          <div className="font-bold text-amber-700">Shopify への適用手順</div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>下のボタンで zip をダウンロード</li>
            <li>Shopify 管理画面 → <b>オンラインストア → テーマ</b> を開く</li>
            <li>「テーマを追加 → zip ファイルをアップロード」を選択</li>
            <li>アップロードしたテーマを「公開」して完了</li>
          </ol>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <a
            href={`/api/download/${id}`}
            className="px-8 py-4 rounded-full text-lg font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 shadow-md"
          >
            zip をダウンロード
          </a>
          <button
            onClick={onReset}
            className="px-6 py-4 rounded-full text-base bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 shadow-sm"
          >
            もう一度作る
          </button>
        </div>
      </div>
    </main>
  );
}
