#!/usr/bin/env bash
# EC Maker — one-line installer & launcher (macOS)
#
# 友達向けの 1 行コマンド:
#   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Getabako/ECMaker/main/install.sh)"
#
# 何度貼っても OK。初回は全部インストール、2 回目以降は最新版に更新して起動。

set -e

GH_REPO="${ECMAKER_REPO:-Getabako/ECMaker}"
BRANCH="${ECMAKER_BRANCH:-main}"
# インストール先：デスクトップにわかりやすく置く。中身を開いて AI（codex / Claude）に
# 直してもらえるよう、隠しフォルダではなくデスクトップの "ECMaker" フォルダにする。
INSTALL_DIR="${ECMAKER_HOME:-$HOME/Desktop/ECMaker}"

cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*" >&2; }

cyan "▶ EC Maker セットアップを開始します"

if [[ "$(uname)" != "Darwin" ]]; then
  red "✗ install.sh は macOS 向けです。"
  red "Windows の方は PowerShell を開いて以下を実行してください:"
  red "  iwr -useb https://raw.githubusercontent.com/$GH_REPO/main/install.ps1 | iex"
  exit 1
fi

if ! command -v brew >/dev/null 2>&1; then
  cyan "▶ Homebrew をインストールします（初回のみ・数分かかります）"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [[ -d /opt/homebrew/bin ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  cyan "▶ Node.js をインストールします"
  brew install node
fi

command -v git >/dev/null 2>&1 || brew install git

# 旧フォルダ ~/.ecmaker からの移行（新しい場所が未作成なら引っ越し）
OLD_DIR="$HOME/.ecmaker"
if [[ -z "${ECMAKER_HOME:-}" && -d "$OLD_DIR/.git" && ! -d "$INSTALL_DIR/.git" ]]; then
  cyan "▶ 旧フォルダ ~/.ecmaker をデスクトップへ移動します"
  mkdir -p "$(dirname "$INSTALL_DIR")"
  mv "$OLD_DIR" "$INSTALL_DIR"
fi

if [[ -d "$INSTALL_DIR/.git" ]]; then
  # ローカルで修正している人（AI に直してもらった等）の変更を消さないように、
  # 未コミットの修正がある場合は自動更新（reset --hard）をスキップして保持する。
  if [[ -n "$(git -C "$INSTALL_DIR" status --porcelain 2>/dev/null)" ]]; then
    cyan "▶ あなたの修正を保持したまま起動します（自動更新はスキップ）"
    cyan "  最新版に戻したい時は: cd \"$INSTALL_DIR\" && git reset --hard origin/$BRANCH"
  else
    cyan "▶ 既存のアプリを最新版に更新します"
    git -C "$INSTALL_DIR" fetch --quiet origin "$BRANCH"
    git -C "$INSTALL_DIR" reset --quiet --hard "origin/$BRANCH"
  fi
else
  cyan "▶ アプリをダウンロードします → $INSTALL_DIR"
  rm -rf "$INSTALL_DIR"
  git clone --quiet --depth 1 --branch "$BRANCH" \
    "https://github.com/$GH_REPO.git" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

CUR_SHA="$(git -C "$INSTALL_DIR" rev-parse HEAD 2>/dev/null || echo unknown)"
MARK_FILE="$INSTALL_DIR/.next/.built-sha"
LAST_SHA=""
[[ -f "$MARK_FILE" ]] && LAST_SHA="$(cat "$MARK_FILE" 2>/dev/null || echo)"

NEED_BUILD=0
[[ ! -d node_modules ]] && NEED_BUILD=1
[[ ! -f .next/standalone/server.js ]] && NEED_BUILD=1
[[ "$CUR_SHA" != "$LAST_SHA" ]] && NEED_BUILD=1
# ローカルで直したソースがビルドより新しければ、その修正を反映するため再ビルド
if [[ -f "$MARK_FILE" ]] && [[ -n "$(find app lib bin public next.config.ts package.json -newer "$MARK_FILE" 2>/dev/null || true)" ]]; then
  NEED_BUILD=1
fi

if [[ "$NEED_BUILD" -eq 1 ]]; then
  cyan "▶ アプリを準備中（初回 or 更新があった時のみ・30 秒〜1 分）"
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install --silent
    pnpm build >/dev/null
  else
    npm install --silent
    npm run build >/dev/null
  fi
  mkdir -p "$INSTALL_DIR/.next"
  echo "$CUR_SHA" > "$MARK_FILE"
fi

green ""
green "✓ 起動します。ブラウザに表示された URL を開いてください。終了は Ctrl+C。"
green ""
exec node bin/cli.js
