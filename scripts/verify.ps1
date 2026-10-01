# ============================================================================
# VERIFICAÃ‡ÃƒO COMPLETA â€” Studio Liso Espelhado
# Uso:  powershell -ExecutionPolicy Bypass -File scripts\verify.ps1
# Depende do servidor rodando em http://localhost:3000
# ============================================================================

$ErrorActionPreference = "Continue"
$base = "http://localhost:3000"
$nd   = "$env:LOCALAPPDATA\Programs\nodejs"
$falhas = 0

# Servico de cabelo escolhido NO BANCO (o catalogo e editavel pelo painel,
# entao o script nao depende de id fixo).
$hairId = $null
try {
  $svcJson = (& "$nd\node.exe" "scripts\pick-service.mjs" 2>$null | Out-String).Trim()
  $svc = $svcJson | ConvertFrom-Json
  $hairId = [int]$svc.hair
  "servico      : cabelo id=$hairId ($($svc.hairName)) · unhas id=$($svc.nails) ($($svc.nailsName))"
} catch {
  "servico      : FALHA ao ler os servicos do banco"
  $falhas++
  $hairId = 1
}

function Espera($url, $max = 300) {
  for ($i = 1; $i -le 6; $i++) {
    try { return Invoke-RestMethod -Uri $url -Method Get -TimeoutSec $max }
    catch { Start-Sleep -Seconds 5 }
  }
  return $null
}

"============================================================================"
" 1) ROTA PUBLICA"
"============================================================================"
$rotas = @("/","/servicos","/promocoes","/resultados","/mostruario","/sobre",
           "/contato","/agendar","/politica-de-privacidade","/termos-de-uso",
           "/politica-de-agendamento","/sitemap.xml","/robots.txt")
foreach ($p in $rotas) {
  $code = curl.exe -s --max-time 240 -o "$env:TEMP\opencode\v.html" -w "%{http_code}" "$base$p"
  $html = Get-Content "$env:TEMP\opencode\v.html" -Raw -ErrorAction SilentlyContinue
  $erro = if ($html -match 'Application error|Only plain objects|Module not found|__next_error__') { "ERRO-CONTEUDO" } else { "" }
  $ok = ($code -eq "200") -and (-not $erro)
  if (-not $ok) { $falhas++ }
  "{0,-32} {1} {2} {3}" -f $p, $code, $erro, $(if ($ok) { "OK" } else { "FALHOU" })
}

""
"============================================================================"
" 2) FLUXO DE AGENDAMENTO (reservar -> segurar -> pagar -> aprovar)"
"============================================================================"
$data = $null
$hora = $null

# Procura o primeiro dia Ãºtil (terÃ§a a sÃ¡bado) com horÃ¡rio livre,
# para que o script possa ser executado quantas vezes for preciso.
for ($i = 1; $i -le 14; $i++) {
  $cand = (Get-Date).AddDays($i).ToString("yyyy-MM-dd")
  $r = Espera "$base/api/booking/availability?date=$cand&serviceId=$hairId"
  if ($r -and $r.slots -and $r.slots.Count -gt 0) {
    $data = $cand
    $hora = $r.slots[0]
    break
  }
}

if (-not $data) {
  "FALHA: nenhum dia com horario livre em 14 dias"
  $falhas++
  $body = $null
} else {
  "data/hora    : $data as $hora"
  $body = @{ serviceId = $hairId; date = $data; time = $hora
             name = "Verificacao Auto"; whatsapp = "24999990001"
             email = "verificacao@studio.com" } | ConvertTo-Json
}

$bk = $null
if ($body) {
  for ($i = 1; $i -le 10; $i++) {
    try {
      $bk = Invoke-RestMethod -Uri "$base/api/booking" -Method Post `
        -ContentType "application/json" -Body $body -TimeoutSec 240
      break
    } catch { Start-Sleep -Seconds 5 }
  }
}

if (-not $bk) {
  "FALHA: nao foi possivel criar a reserva"
  $falhas++
} else {
  "reserva      : $($bk.code)"
  "taxa 15%     : $($bk.fee) centavos  (total $($bk.total), restante $($bk.remainder))"
  $esperadoFee = [math]::Round($bk.total * 0.15)
  if ($bk.fee -ne $esperadoFee) { "FALHA: taxa difere de 15% (esperado $esperadoFee)"; $falhas++ }
  else { "taxa 15%     : CORRETA" }

  $s1 = Espera "$base/api/booking/availability?date=$data&serviceId=$hairId"
  $segurou = $s1.slots -notcontains $hora
  if ($segurou) { "slot segurado: SIM (pendente travou o horario)" }
  else { "slot segurado: NAO  <-- FALHA"; $falhas++ }

  $pay = $null
  try {
    $pay = Invoke-RestMethod -Uri "$base/api/booking/payment" -Method Post `
      -ContentType "application/json" -Body (@{ code = $bk.code; method = "pix" } | ConvertTo-Json) `
      -TimeoutSec 240
    "pagamento    : mode=$($pay.mode) valor=$($pay.amountCents)"
  } catch { "pagamento    : FALHA"; $falhas++ }

  $ok = $null
  try {
    $ok = Invoke-RestMethod -Uri "$base/api/booking/approve" -Method Post `
      -ContentType "application/json" -Body (@{ code = $bk.code } | ConvertTo-Json) `
      -TimeoutSec 240
    "aprovacao    : status=$($ok.status) pagamento=$($ok.paymentStatus)"
  } catch { "aprovacao    : FALHA"; $falhas++ }

  if ($ok -and ($ok.status -eq "confirmed") -and ($ok.paymentStatus -eq "paid")) {
    "regua OK     : reservou, segurou, pagou e confirmou SEM cancelar"
  } else {
    "regua        : FALHA <-- fluco quebrado"
    $falhas++
  }

  $s2 = Espera "$base/api/booking/availability?date=$data&serviceId=$hairId"
  if ($s2.slots -notcontains $hora) { "slot travado : SIM (pos-pagamento)" }
  else { "slot travado : NAO <-- FALHA"; $falhas++ }
}

""
"============================================================================"
" 3) PAINEL ADMIN"
"============================================================================"
$tok = ""
try {
  $tok = ((& "$nd\node.exe" "scripts\session-token.mjs" 2>$null) | Out-String).Trim()
  if ($tok.Length -eq 64) { "sessao admin  : criada (token de 64 chars)" }
  else { "sessao admin  : FALHA ao gerar token"; $falhas++ }
} catch { "sessao admin  : FALHA ao gerar token"; $falhas++ }

foreach ($p in @("/admin","/admin/agenda","/admin/avisos","/admin/servicos","/admin/promocoes",
                 "/admin/galeria","/admin/depoimentos","/admin/conteudo","/admin/usuarios","/admin/login")) {
  $code = curl.exe -s --max-time 240 -H "Cookie: studio_session=$tok" -o NUL -w "%{http_code}" "$base$p"
  $esperado = if ($p -eq "/admin/login") { "307" } else { "200" }
  $ok = ($code -eq "200") -or ($p -eq "/admin/login" -and ($code -eq "307" -or $code -eq "200"))
  if (-not $ok) { $falhas++ }
  "{0,-32} {1} {2}" -f $p, $code, $(if ($ok) { "OK" } else { "FALHOU" })
}

""
"============================================================================"
if ($falhas -eq 0) { "RESULTADO: TUDO OK  âœ…" }
else { "RESULTADO: $falhas problema(s)  âŒ" }
"============================================================================"
