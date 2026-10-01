<#
  Auditoria Lighthouse (acessibilidade, boas práticas, SEO) em todas as páginas.
  Uso:  powershell -ExecutionPolicy Bypass -File scripts\lighthouse-audit.ps1
  Pré-requisito: servidor rodando em http://localhost:3000 (npm start).
  Saída: JSON por página em %TEMP%\opencode\lh-<pagina>.json
  Resumo: imprime a nota de cada categoria ao final.
#>
param(
  [string]$Base = "http://localhost:3000",
  [string]$OutDir = "$env:TEMP\opencode",
  [string[]]$Apenas = @()
)

$ErrorActionPreference = "Stop"
$nd = "$env:LOCALAPPDATA\Programs\nodejs"
$env:Path = "$env:Path;$nd"
$root = Split-Path -Parent $PSScriptRoot

# --- localiza o binário do Lighthouse (cache do npx) ------------------------
$bin = Get-ChildItem "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Filter "lighthouse.cmd" -ErrorAction SilentlyContinue |
  Select-Object -First 1
if (-not $bin) {
  Write-Host "Lighthouse não encontrado no cache; baixando via npx..."
  & "$nd\npx.cmd" --yes lighthouse@12 --version | Out-Null
  $bin = Get-ChildItem "$env:LOCALAPPDATA\npm-cache\_npx" -Recurse -Filter "lighthouse.cmd" -ErrorAction SilentlyContinue |
    Select-Object -First 1
}
if (-not $bin) { throw "Binário do Lighthouse não encontrado." }
$lh = $bin.FullName

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# --- páginas públicas --------------------------------------------------------
$paginas = [ordered]@{
  "home"     = "/"
  "servicos" = "/servicos"
  "promocoes" = "/promocoes"
  "resultados" = "/resultados"
  "mostruario" = "/mostruario"
  "sobre"    = "/sobre"
  "contato"  = "/contato"
  "agendar"  = "/agendar"
  "legal"    = "/politica-de-agendamento"
  "privacidade" = "/politica-de-privacidade"
  "termos"   = "/termos-de-uso"
}

# --- sessão de admin (para as páginas do painel) -----------------------------
$token = (& "$nd\node.exe" "$root\scripts\session-token.mjs").ToString().Trim()
$headersFile = Join-Path $OutDir "lh-headers.json"
@{ Cookie = "studio_session=$token" } | ConvertTo-Json -Compress |
  Set-Content -Path $headersFile -Encoding utf8

$admin = [ordered]@{
  "admin-dashboard" = "/admin"
  "admin-avisos"    = "/admin/avisos"
  "admin-agenda"    = "/admin/agenda"
  "admin-conteudo"  = "/admin/conteudo"
  "admin-servicos"  = "/admin/servicos"
  "admin-galeria"   = "/admin/galeria"
}

$checar = [ordered]@{}
foreach ($k in $paginas.Keys)  { $checar[$k] = $paginas[$k] }
foreach ($k in $admin.Keys)    { $checar[$k] = $admin[$k] }

if ($Apenas.Count -gt 0) {
  $selecionado = [ordered]@{}
  foreach ($k in $Apenas) { if ($checar.Contains($k)) { $selecionado[$k] = $checar[$k] } }
  $checar = $selecionado
}

$i = 0
foreach ($k in $checar.Keys) {
  $i++
  # Chrome órfão de execuções anteriores deixa a máquina lenta (PAGE_HUNG);
  # mata entre cada página para manter a auditoria estável.
  # cmd /c + redirecionamento evita o stderr que abortaria o script.
  cmd /c "taskkill /F /IM chrome.exe >nul 2>&1" | Out-Null
  Start-Sleep -Seconds 3
  $url = $Base + $checar[$k]
  $dest = Join-Path $OutDir "lh-$k.json"
  Write-Host "[$i/$($checar.Count)] $k -> $url"
  $args = @(
    $url,
    "--only-categories=accessibility,best-practices,seo",
    "--throttling-method=provided",
    "--output=json",
    "--output-path=$dest",
    "--chrome-flags=--headless=new --no-sandbox",
    "--quiet"
  )
  if ($k -like "admin-*") { $args += "--extra-headers=$headersFile" }
  & $lh @args
  if ($LASTEXITCODE -ne 0) { Write-Host "   FALHOU (exit $LASTEXITCODE)" }
}

# --- resumo ------------------------------------------------------------------
$script = @'
import fs from "node:fs";
const d = process.env.TEMP + "/opencode";
const arqs = fs.readdirSync(d).filter(f => /^lh-.+\.json$/.test(f) && !f.includes("headers"));
let ruim = 0;
for (const f of arqs.sort()) {
  const j = JSON.parse(fs.readFileSync(`${d}/${f}`, "utf8"));
  const sc = Object.entries(j.categories).map(([, c]) => Math.round((c.score || 0) * 100));
  const pior = Math.min(...sc);
  const falhas = [];
  for (const c of Object.values(j.categories)) {
    for (const r of (c.auditRefs || [])) {
      const a = j.audits[r.id];
      if (a && a.score !== null && a.score < 1) falhas.push(`${c.id}:${r.id}`);
    }
  }
  if (pior < 100) ruim++;
  const nome = f.replace(/^lh-/, "").replace(/\.json$/, "");
  console.log(`${nome.padEnd(18)} ${sc.join("/").padEnd(12)} ${falhas.length ? "FALHAS " + falhas.join(", ") : ""}`);
}
console.log(`\n${arqs.length} páginas auditadas, ${ruim} com nota < 100.`);
'@
$scriptPath = Join-Path $OutDir "lh-resumo.mjs"
Set-Content -Path $scriptPath -Value $script -Encoding utf8
node $scriptPath
