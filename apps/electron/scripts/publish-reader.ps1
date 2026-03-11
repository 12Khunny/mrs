# Publishes ReaderService into the Electron app resources folder.
$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path "$PSScriptRoot\..\..\.."
$serviceProj = Join-Path $repoRoot "services\MRS.ReaderService\MRS.ReaderService\MRS.ReaderService.csproj"
$outDir = Join-Path $PSScriptRoot "..\reader-service"

if (Test-Path $outDir) {
  Remove-Item -Recurse -Force $outDir
}
New-Item -ItemType Directory -Path $outDir | Out-Null

dotnet publish $serviceProj -c Release -r win-x86 --self-contained true -p:PublishSingleFile=true -o $outDir
if ($LASTEXITCODE -ne 0) {
  throw "dotnet publish failed with exit code $LASTEXITCODE"
}

Write-Host "Published ReaderService to $outDir"
