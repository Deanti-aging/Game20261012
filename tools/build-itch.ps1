# 打包成 itch.io 可上传的 zip（index.html 位于 zip 根目录）
# 用法：在项目根目录运行   powershell -ExecutionPolicy Bypass -File tools/build-itch.ps1
# 输出：dist/ml-robot-trainer.zip

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'
$zipPath = Join-Path $dist 'ml-robot-trainer.zip'
New-Item -ItemType Directory -Force $dist | Out-Null
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$cfg = Get-Content (Join-Path $root 'js/config.js') -Raw -Encoding UTF8
if ($cfg -match 'YOUR_PAYPAL_NAME|YOUR_AFDIAN_NAME') {
  Write-Warning '打赏链接还是占位符！请先修改 js/config.js 里的 paypalUrl 和 afdianUrl。'
}

# 只打包游戏需要的文件
$files = @('index.html') +
  (Get-ChildItem (Join-Path $root 'css') -File -Recurse | ForEach-Object { $_.FullName.Substring($root.Length + 1) }) +
  (Get-ChildItem (Join-Path $root 'js') -File -Recurse | ForEach-Object { $_.FullName.Substring($root.Length + 1) })

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
  foreach ($f in $files) {
    # itch.io 运行在 Linux 服务器上，zip 内路径必须用正斜杠
    $entryName = $f -replace '\\', '/'
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $root $f), $entryName, 'Optimal') | Out-Null
    Write-Host "  + $entryName"
  }
} finally {
  $zip.Dispose()
}
$size = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host "完成：$zipPath ($size KB)"
