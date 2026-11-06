$wshShell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "WeRecordIt Studio.lnk"

# Dinamis mengacu pada direktori lokasi script berada (tanpa hardcoded path)
$rootDir = $PSScriptRoot
$targetBat = Join-Path $rootDir "launch-werecordit.bat"

$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetBat
$shortcut.WorkingDirectory = $rootDir
$shortcut.Description = "WeRecordIt Enterprise Studio - Automation Video & Snipping Suite"
$shortcut.Save()

Write-Host "Shortcut berhasil dibuat di: $shortcutPath" -ForegroundColor Green
Write-Host "Target: $targetBat" -ForegroundColor Cyan
