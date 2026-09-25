param(
    [string]$Output = "hosting-upload.zip",
    [switch]$IncludeNodeModules
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputPath = Join-Path $projectRoot $Output

if (Test-Path $outputPath) {
    Remove-Item -LiteralPath $outputPath -Force
}

$excludePrefixes = @(
    ".agents\",
    ".agents/",
    ".codex\",
    ".codex/",
    ".git\",
    ".git/",
    ".github\",
    ".github/",
    ".deploy_tmp\",
    ".deploy_tmp/",
    ".vscode\",
    ".vscode/",
    "android\\",
    "android/",
    "ios\\",
    "ios/",
    "Final-Apps\\",
    "Final-Apps/",
    "Archive\\",
    "Archive/",
    "docs\\",
    "docs/",
    "data\\",
    "data/",
    "node_modules\",
    "node_modules/",
    "tools\",
    "tools/"
)

if ($IncludeNodeModules) {
    $excludePrefixes = $excludePrefixes | Where-Object { $_ -notlike "node_modules*" }
}

$allFiles = Get-ChildItem -Path $projectRoot -Recurse -File -Force
$filesToPack = $allFiles | Where-Object {
    $relative = $_.FullName.Substring($projectRoot.Length).TrimStart('\', '/')
    if ($excludePrefixes | Where-Object { $relative.StartsWith($_, [System.StringComparison]::OrdinalIgnoreCase) }) {
        return $false
    }
    foreach ($prefix in @()) {
        if ($relative.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $false
        }
    }

    if ($relative -eq $Output) { return $false }
    if ($relative -in @(".env", "hostinger.env", ".cpanel.yml", "vercel.json", ".vercelignore", "README.md")) { return $false }
    if ($_.Extension -ieq ".zip") { return $false }
    if ($_.Extension -ieq ".log") { return $false }
    return $true
}

if (-not $filesToPack) {
    throw "No files selected for archive."
}

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("beacon-lights-hosting-" + [Guid]::NewGuid().ToString("N"))
if (Test-Path $tempDir) {
    Remove-Item -LiteralPath $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

foreach ($file in $filesToPack) {
    $relative = $file.FullName.Substring($projectRoot.Length).TrimStart('\', '/')
    $target = Join-Path $tempDir $relative
    $targetDir = Split-Path -Parent $target
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    Copy-Item -LiteralPath $file.FullName -Destination $target
}

$envTemplate = @'
# Copy this file to .env in the Hostinger Node.js application directory and fill in real values.
DB_HOST=localhost
DB_NAME=CHANGE_ME_DATABASE_NAME
DB_USER=CHANGE_ME_DATABASE_USER
DB_PASSWORD=CHANGE_ME_DATABASE_PASSWORD
DB_PORT=3306
AUTO_CREATE_DB=false

JWT_SECRET=CHANGE_ME_LONG_RANDOM_SECRET
ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_ME_STRONG_ADMIN_PASSWORD
PRINCIPAL_USERNAME=principal@school.com
PRINCIPAL_PASSWORD=CHANGE_ME_STRONG_PRINCIPAL_PASSWORD

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Green Land Model School Jand

SCHOOL_WEBSITE=https://greenlandjand.com
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
'@
Set-Content -LiteralPath (Join-Path $tempDir ".env.example") -Value $envTemplate -Encoding UTF8

$deployNotes = @'
GREEN LAND MODEL SCHOOL JAND — HOSTINGER NODE.JS PACKAGE
Domain: greenlandjand.com

1. Extract this ZIP into the Hostinger Node.js application directory assigned to the domain.
2. Set the application startup file to app.js.
3. Install dependencies with: npm install
4. Copy .env.example to .env (or add the same settings in hPanel Environment Variables) and enter the MySQL credentials and unique passwords/secrets.
5. Restart the Node.js application from hPanel.

The package intentionally omits local .env files, local databases, runtime JSON records and student data. Configure the production database and keep any existing production data in Hostinger.
'@
Set-Content -LiteralPath (Join-Path $tempDir "HOSTINGER-DEPLOYMENT.txt") -Value $deployNotes -Encoding UTF8

Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath $outputPath -Force
Remove-Item -LiteralPath $tempDir -Recurse -Force

Write-Output "Created: $outputPath"
Write-Output "Include node_modules: $($IncludeNodeModules.IsPresent)"
