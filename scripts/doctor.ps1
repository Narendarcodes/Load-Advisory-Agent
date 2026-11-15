# scripts/doctor.ps1 : one-pass local environment check for Saral/CADRA.
#
#   powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1
#
# Non-interactive and idempotent: it only reads state. Exit code 0 means every check
# passed, 1 means at least one failed, 2 means Docker is not usable at all.
# Add -Json for a machine-readable array instead of the table.
param([switch]$Json)

$ErrorActionPreference = "Continue"
$S = "C:\Users\golla\saral_cadra-run"
$R = "C:\Users\golla\Documents\Projects\saral_cadra"
$env:DOCKER_CONFIG = "$S\dockercfg"

$script:Failures = 0
$script:Rows = [System.Collections.Generic.List[object]]::new()

function Pick([bool]$Ok, [string]$Yes, [string]$No) { if ($Ok) { $Yes } else { $No } }

function Add-Row([string]$Name, [bool]$Ok, [string]$Detail) {
    $script:Rows.Add([pscustomobject]@{ check = $Name; result = (Pick $Ok "pass" "FAIL"); detail = $Detail })
    if (-not $Ok) { $script:Failures++ }
}

function Test-Port([int]$Port) {
    try {
        $client = New-Object Net.Sockets.TcpClient
        $client.Connect("127.0.0.1", $Port)
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

function Invoke-Readable([string[]]$Command, [string]$Label) {
    $code = $null
    try {
        $output = & $Command[0] @($Command | Select-Object -Skip 1) 2>&1 | Out-String
        $code = $LASTEXITCODE
    } catch {
        $output = $_.Exception.Message
    }
    if ($null -eq $code) { $code = 1 }
    return [pscustomobject]@{ Ok = ($code -eq 0); Output = "$output".Trim() }
}

# --- Docker -----------------------------------------------------------------
$docker = Invoke-Readable @("docker", "version", "--format", "{{.Server.Version}}")
$dockerDetail = if ($docker.Ok) { "server $($docker.Output)" } else { "docker version failed; is the Docker Desktop engine running?" }
Add-Row "docker daemon" $docker.Ok $dockerDetail

$containers = @()
if ($docker.Ok) {
    $ps = Invoke-Readable @("docker", "ps", "--format", "{{.Names}}")
    $containers = @($ps.Output -split "\r?\n" | Where-Object { $_ })
}
foreach ($name in @("saral_cadra-backend-1", "saral_cadra-frontend-1", "saral_cadra-ocr-1", "saral_cadra_front_door")) {
    $running = $containers -contains $name
    Add-Row "container $name" $running (Pick $running "running" "not in docker ps")
}

# --- Host services (svc.ps1) ------------------------------------------------
$decider = @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match "svc\.ps1 decider" }).Count -gt 0
Add-Row "service decider" $decider (Pick $decider "svc.ps1 decider running" "not running (start-app.ps1)")
foreach ($svc in @(@("bureau", 8011), @("kyc", 8012), @("agent", 8095), @("chat runtime", 4200))) {
    $up = Test-Port $svc[1]
    Add-Row "service $($svc[0])" $up (Pick $up "listening on $($svc[1])" "port $($svc[1]) closed")
}

# --- Ports ------------------------------------------------------------------
foreach ($p in @(@("frappe frontend", 8080), @("front door", 8081), @("copilot runtime", 4200))) {
    $up = Test-Port $p[1]
    Add-Row "port $($p[0])" $up (Pick $up "127.0.0.1:$($p[1]) open" "127.0.0.1:$($p[1]) closed")
}

# --- OCR sidecar and GPU ----------------------------------------------------
$ocrHealth = ""
if ($docker.Ok -and ($containers -contains "saral_cadra-backend-1")) {
    $health = Invoke-Readable @("docker", "exec", "saral_cadra-backend-1", "curl", "-s", "-m", "5", "http://ocr:8866/health")
    $ocrHealth = $health.Output
}
$ocrOk = $ocrHealth -match '"ok"\s*:\s*true'
$ocrDetail = if ($ocrOk) { ($ocrHealth -replace "\s+", " ") } else { "backend cannot reach ocr:8866" }
Add-Row "ocr sidecar :8866" $ocrOk $ocrDetail

$gpu = Invoke-Readable @("docker", "exec", "saral_cadra-ocr-1", "python", "-c", "import paddle; print(paddle.device.cuda.device_count())")
$gpuCount = 0
[int]::TryParse(($gpu.Output -split "\r?\n" | Select-Object -Last 1), [ref]$gpuCount) | Out-Null
Add-Row "gpu in ocr container" ($gpu.Ok -and $gpuCount -gt 0) (Pick $gpu.Ok "$gpuCount CUDA device(s) visible" "paddle could not see CUDA")

# --- Site config flags ------------------------------------------------------
$flags = $null
if ($docker.Ok -and ($containers -contains "saral_cadra-backend-1")) {
    $raw = Invoke-Readable @("docker", "exec", "saral_cadra-backend-1", "cat", "/home/frappe/frappe-bench/sites/p1loan.local/site_config.json")
    if ($raw.Ok) {
        try { $flags = $raw.Output | ConvertFrom-Json } catch { $flags = $null }
    }
}
if ($null -eq $flags) {
    Add-Row "site config flags" $false "could not read p1loan.local/site_config.json from the backend container"
} else {
    $detail = "saral_dev_panel=$($flags.saral_dev_panel) enable_demo_fixtures=$($flags.enable_demo_fixtures) saral_synthetic_mode=$($flags.saral_synthetic_mode)"
    Add-Row "site config flags" ($null -ne $flags.saral_dev_panel) $detail
}

# --- Front door -------------------------------------------------------------
try {
    $portalResponse = Invoke-WebRequest -Uri "http://127.0.0.1:8081/" -UseBasicParsing -TimeoutSec 8
    $portalOk = $portalResponse.StatusCode -eq 200
    $portalDetail = "HTTP $($portalResponse.StatusCode)"
} catch {
    $portalOk = $false
    $portalDetail = "no HTTP 200 from the front door ($($_.Exception.Message))"
}
Add-Row "portal :8081" $portalOk $portalDetail

# --- Python dependencies ----------------------------------------------------
$py = "$R\.venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
    Add-Row "python deps" $false ".venv missing; run: python -m venv .venv && .venv\Scripts\python.exe -m pip install -r requirements.txt -r requirements-test.txt"
} else {
    $deps = Invoke-Readable @($py, "-c", "import pypdfium2, PIL, numpy, pytest, ruff, rank_bm25, qdrant_client, bs4, yaml, pymupdf; print('ok')")
    $depsDetail = if ($deps.Ok) {
        "test tooling importable in .venv"
    } else {
        "missing test dependency in .venv; run: $py -m pip install -r requirements.txt -r requirements-test.txt"
    }
    Add-Row "python deps" $deps.Ok $depsDetail
}

# --- Output -----------------------------------------------------------------
if ($Json) {
    $script:Rows | ConvertTo-Json -Depth 3
} else {
    "{0,-26} {1,-5} {2}" -f "CHECK", "RESULT", "DETAIL"
    "-" * 78
    foreach ($row in $script:Rows) {
        "{0,-26} {1,-5} {2}" -f $row.check, $row.result, $row.detail
    }
    "-" * 78
    if ($script:Failures -eq 0) {
        "PASS: all $($script:Rows.Count) checks passed."
    } else {
        "FAIL: $($script:Failures) of $($script:Rows.Count) checks failed."
    }
}

if (-not $docker.Ok) { exit 2 }
if ($script:Failures -gt 0) { exit 1 }
exit 0
