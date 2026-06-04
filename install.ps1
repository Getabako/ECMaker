# EC Maker — Windows one-line installer & launcher
#
# 友達向けの 1 行 (PowerShell):
#   iwr -useb https://raw.githubusercontent.com/Getabako/ECMaker/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

$GH_REPO   = if ($env:ECMAKER_REPO)   { $env:ECMAKER_REPO }   else { "Getabako/ECMaker" }
$BRANCH    = if ($env:ECMAKER_BRANCH) { $env:ECMAKER_BRANCH } else { "main" }
$InstallDir = if ($env:ECMAKER_HOME)  { $env:ECMAKER_HOME }  else { "$HOME\.ecmaker" }

function Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function OK($msg)   { Write-Host $msg -ForegroundColor Green }
function Err($msg)  { Write-Host $msg -ForegroundColor Red }

Info "▶ EC Maker セットアップを開始します（Windows）"

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Err "✗ winget が見つかりません。Windows 10/11 で Microsoft Store から 'App Installer' を入れてください。"
    exit 1
}

function Ensure-Pkg($cmd, $wingetId, $label) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Info "▶ $label をインストールします"
        winget install --id $wingetId -e --silent --accept-source-agreements --accept-package-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
}

Ensure-Pkg "node"  "OpenJS.NodeJS.LTS"  "Node.js (LTS)"
Ensure-Pkg "git"   "Git.Git"            "Git"

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Info "▶ pnpm を有効化します"
    corepack enable
}

if (Test-Path "$InstallDir\.git") {
    Info "▶ 既存のアプリを最新版に更新します"
    git -C $InstallDir fetch --quiet origin $BRANCH
    git -C $InstallDir reset --quiet --hard "origin/$BRANCH"
} else {
    Info "▶ アプリをダウンロードします → $InstallDir"
    if (Test-Path $InstallDir) { Remove-Item -Recurse -Force $InstallDir }
    git clone --quiet --depth 1 --branch $BRANCH "https://github.com/$GH_REPO.git" $InstallDir
}

Set-Location $InstallDir

$CurSha = (git -C $InstallDir rev-parse HEAD).Trim()
$MarkFile = "$InstallDir\.next\.built-sha"
$LastSha = if (Test-Path $MarkFile) { (Get-Content $MarkFile -ErrorAction SilentlyContinue).Trim() } else { "" }

$NeedBuild = $false
if (-not (Test-Path "$InstallDir\node_modules")) { $NeedBuild = $true }
if (-not (Test-Path "$InstallDir\.next\standalone\server.js")) { $NeedBuild = $true }
if ($CurSha -ne $LastSha) { $NeedBuild = $true }

if ($NeedBuild) {
    Info "▶ アプリを準備中（初回 or 更新時のみ）"
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm install --silent
        pnpm build | Out-Null
    } else {
        npm install --silent
        npm run build | Out-Null
    }
    New-Item -ItemType Directory -Force -Path "$InstallDir\.next" | Out-Null
    Set-Content -Path $MarkFile -Value $CurSha
}

OK ""
OK "✓ 起動します。終了は Ctrl+C。"
OK ""
node "$InstallDir\bin\cli.js"
