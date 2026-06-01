$ErrorActionPreference = "Stop"

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$BundledNode = "C:\Users\kienq\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$Node = if (Test-Path $BundledNode) { $BundledNode } else { "node" }

Set-Location $Here
Write-Host "Starting Lumi Winx Ollama proxy on http://localhost:8788"
Write-Host "Keep this window open while ngrok is forwarding to port 8788."
& $Node ".\ollama-proxy.js"
