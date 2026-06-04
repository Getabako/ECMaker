# EC Maker

簡単なフォーム入力だけで、**Shopify テーマ（Online Store 2.0 互換）** を自動生成し、そのままアップロードできる zip でダウンロードできるローカルツール。

シードテンプレートには Neo+AID のアンダーグラウンド系 Shopify テーマ（ヒーロー動画スイッチャー / バイナル DJ デッキ風 UI / 商品スクロールギャラリー / 店舗情報 + 地図埋め込み / FAQ / 年齢ゲート）を採用。

## 使い方（友達に渡すのはこの 1 行）

### Mac

**ターミナル**を開いて、下を 1 行コピペして Enter:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Getabako/ECMaker/main/install.sh)"
```

### Windows

**PowerShell** を開いて、下を 1 行コピペして Enter:

```
iwr -useb https://raw.githubusercontent.com/Getabako/ECMaker/main/install.ps1 | iex
```

---

初回は Node / git を自動で入れます（数分）。

ブラウザで `http://localhost:4577` を開くと、店舗情報・色・ヒーロー動画 URL・取扱ブランド・FAQ などを入力するフォームが出ます。「Shopify テーマ zip を生成」を押すと数秒で zip がダウンロードできます。

終了は **Ctrl+C**。2 回目以降も同じ 1 行で最新版に更新して起動。

## Shopify への適用

1. 生成された zip をダウンロード
2. Shopify 管理画面 → **オンラインストア → テーマ**
3. 「テーマを追加」→「zip ファイルをアップロード」を選択
4. アップロードしたテーマを「公開」して完了

## 機能

- **フォーム入力 → 即 zip 生成** — Codex / LLM 等を使わない純粋なテンプレート置換。実行が速く API 鍵不要。
- **Neo+AID シードテンプレート** — レイアウト・スタイリング・ヒーロー動画スイッチャーをそのまま使い回し、テキスト・色・URL だけ差し替える。
- **Shopify Online Store 2.0 互換** — `layout/`・`templates/`・`snippets/`・`assets/`・`config/` がそのまま zip ルートに展開される。
- **ヒーロー動画 URL を 6 枠** — フォームで指定するか、Shopify 管理画面の `theme_settings` から後で上書きするか選べる。

## 動作要件

- macOS（Intel / Apple Silicon）または Windows 10/11
- Node.js 20+
- インターネット接続（初回 npm install のみ）

## ローカル開発

```
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # standalone build → bin/cli.js から起動可能
```

シードテンプレートは `templates/shopify/` 配下。差し替えたい場合はディレクトリごと置き換えれば、フォームの置換ロジック（`lib/template.ts`）はそのまま動きます。
