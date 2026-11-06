# WeRecordIt Studio Launcher for PowerShell
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " WeRecordIt Studio - Automation Video & Snipping Suite" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$port = if ($env:PORT) { $env:PORT } else { 4500 }
$hostName = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$url = "http://${hostName}:$port"

# Check if server is already running
$serverRunning = $false
try {
    $res = Invoke-WebRequest -Uri "$url/api/ping" -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
    if ($res.StatusCode -eq 200) {
        $serverRunning = $true
    }
} catch {
    $serverRunning = $false
}

if ($serverRunning) {
    Write-Host "[WeRecordIt] Server aktif di $url. Membuka jendela Studio..." -ForegroundColor Green
} else {
    Write-Host "[WeRecordIt] Menjalankan server Studio di latar belakang..." -ForegroundColor Yellow
    Start-Process node -ArgumentList "src/studio/server.js" -WindowStyle Hidden -WorkingDirectory $PSScriptRoot

    # Wait for server to come up
    $maxWait = 8
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        try {
            $check = Invoke-WebRequest -Uri "$url/api/ping" -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
            if ($check.StatusCode -eq 200) {
                Write-Host "[WeRecordIt] Server siap di $url" -ForegroundColor Green
                break
            }
        } catch {}
    }
}

# Find Installed Browser Executable (Dynamic Detection)
Write-Host "[WeRecordIt] Membuka antarmuka WeRecordIt Studio..." -ForegroundColor Cyan

$browserCandidates = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$selectedBrowser = $null
foreach ($b in $browserCandidates) {
    if (Test-Path $b) {
        $selectedBrowser = $b
        break
    }
}

if ($selectedBrowser) {
    Start-Process $selectedBrowser -ArgumentList "--app=$url", "--window-size=1366,800"
} else {
    # Fallback to default browser
    Start-Process $url
}
