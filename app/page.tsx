"use client";

import { useState } from "react";

type Faq = { q: string; a: string };

type Brief = {
  shopName: string;
  shopNameEn: string;
  tagline: string;
  subTagline: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bloodColor: string;
  darkMode: boolean;
  heroVideoUrls: string[];
  address: string;
  hours: string;
  access: string;
  mapsQuery: string;
  instagramOfficial: string;
  instagramDelivery: string;
  aboutQuote: string;
  aboutBody: string;
  navDeliveryLabel: string;
  brands: string[];
  faqs: Faq[];
  ageGate: boolean;
  ageMin: number;
  copyrightLine: string;
};

const INITIAL: Brief = {
  shopName: "Neo+AID",
  shopNameEn: "NEO PLUS AID",
  tagline: "CHILL BEYOND THE LIMIT.",
  subTagline: "日本一ピースなCBDショップ。",
  description: "新潟駅から3分。日本一ピースなCBDショップ。",
  primaryColor: "#0a0a0a",
  accentColor: "#c5ff00",
  bloodColor: "#ff2d2d",
  darkMode: true,
  heroVideoUrls: ["", "", "", "", "", ""],
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
          <Row>
            <Field label="店舗名（表示用）">
              <input
                className={input}
                value={brief.shopName}
                onChange={(e) => setBrief({ ...brief, shopName: e.target.value })}
                placeholder="Neo+AID"
              />
            </Field>
            <Field label="店舗名（英大文字 / ヒーロー用）">
              <input
                className={input}
                value={brief.shopNameEn}
                onChange={(e) => setBrief({ ...brief, shopNameEn: e.target.value })}
                placeholder="NEO PLUS AID"
              />
            </Field>
          </Row>
          <Field label="タグライン（ヒーローの巨大文字）">
            <input
              className={input}
              value={brief.tagline}
              onChange={(e) => setBrief({ ...brief, tagline: e.target.value })}
              placeholder="CHILL BEYOND THE LIMIT."
            />
          </Field>
          <Field label="サブタグライン（短い説明）">
            <input
              className={input}
              value={brief.subTagline}
              onChange={(e) => setBrief({ ...brief, subTagline: e.target.value })}
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
        </Card>

        <Card title="ブランドカラー" badge="Color">
          <Row>
            <ColorField label="メインカラー" value={brief.primaryColor} onChange={(v) => setBrief({ ...brief, primaryColor: v })} />
            <ColorField label="アクセントカラー" value={brief.accentColor} onChange={(v) => setBrief({ ...brief, accentColor: v })} />
          </Row>
          <ColorField label="ブラッド／danger 色" value={brief.bloodColor} onChange={(v) => setBrief({ ...brief, bloodColor: v })} />
        </Card>

        <Card title="ヒーロー動画 URL（最大 6 本）" badge="Hero Videos">
          <p className="text-sm text-stone-500 -mt-1">
            Shopify「コンテンツ → ファイル」にアップした mp4 の URL を貼ってください。空欄でも可（Shopify 管理画面側で後から差し替え可能）。
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

        <Card title="店舗情報" badge="Store">
          <Field label="住所">
            <input
              className={input}
              value={brief.address}
              onChange={(e) => setBrief({ ...brief, address: e.target.value })}
            />
          </Field>
          <Field label="営業時間">
            <input
              className={input}
              value={brief.hours}
              onChange={(e) => setBrief({ ...brief, hours: e.target.value })}
            />
          </Field>
          <Field label="アクセス（駅からの説明など）">
            <input
              className={input}
              value={brief.access}
              onChange={(e) => setBrief({ ...brief, access: e.target.value })}
            />
          </Field>
          <Field label="地図検索クエリ（Google Maps 用）" hint="iframe 埋め込みに使われます。住所そのままで OK。">
            <input
              className={input}
              value={brief.mapsQuery}
              onChange={(e) => setBrief({ ...brief, mapsQuery: e.target.value })}
            />
          </Field>
        </Card>

        <Card title="SNS" badge="Social">
          <Field label="Instagram（公式）URL">
            <input
              className={input + " font-mono text-sm"}
              value={brief.instagramOfficial}
              onChange={(e) => setBrief({ ...brief, instagramOfficial: e.target.value })}
              placeholder="https://www.instagram.com/your_handle/"
            />
          </Field>
          <Field label="Instagram（デリバリー等サブ）URL">
            <input
              className={input + " font-mono text-sm"}
              value={brief.instagramDelivery}
              onChange={(e) => setBrief({ ...brief, instagramDelivery: e.target.value })}
              placeholder="https://www.instagram.com/your_handle_delivery/"
            />
          </Field>
        </Card>

        <Card title="ABOUT セクション" badge="About">
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
        </Card>

        <Card title="取り扱いブランド" badge="Brands">
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

        <Card title="FAQ" badge="FAQ">
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

        <Card title="年齢確認 / フッター" badge="Misc">
          <Row>
            <label className="flex items-center gap-2 text-stone-700">
              <input
                type="checkbox"
                checked={brief.ageGate}
                onChange={(e) => setBrief({ ...brief, ageGate: e.target.checked })}
                className="accent-orange-500 scale-125"
              />
              年齢ゲートを表示
            </label>
            <Field label="対象年齢（XX 歳以上）">
              <input
                type="number"
                className={input}
                value={brief.ageMin}
                onChange={(e) => setBrief({ ...brief, ageMin: Number(e.target.value) || 18 })}
              />
            </Field>
          </Row>
          <Field label="フッターのコピーライト 1 行">
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
