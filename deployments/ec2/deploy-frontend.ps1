param(
  [Parameter(Mandatory = $true)]
  [string]$HostName,

  [string]$User = "ec2-user",
  [string]$KeyPath = "",
  [string]$EnvFile = "",
  [string]$RemoteRoot = "/opt/mindbliss/frontend"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Timestamp = Get-Date -Format "yyyyMMddHHmmss"
$Artifact = Join-Path ([System.IO.Path]::GetTempPath()) "mindbliss-frontend-$Timestamp.tar.gz"
$ReleaseDir = "$RemoteRoot/releases/$Timestamp"

Push-Location $ProjectRoot
try {
  npm test
  npm run build
  tar -czf $Artifact `
    --exclude ".next" `
    --exclude "node_modules" `
    --exclude "dist" `
    --exclude ".codex-screenshots" `
    package.json package-lock.json next.config.mjs postcss.config.js tailwind.config.js jsconfig.json components.json public src deployments README.md
}
finally {
  Pop-Location
}

$SshArgs = @()
if ($KeyPath) {
  $SshArgs += @("-i", $KeyPath)
}
$SshArgs += @("$User@$HostName")

function Invoke-Remote {
  param([Parameter(Mandatory = $true)][string]$Command)
  ssh @SshArgs $Command
}

function Copy-Remote {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )
  $ScpArgs = @()
  if ($KeyPath) {
    $ScpArgs += @("-i", $KeyPath)
  }
  $ScpArgs += @($Source, "$User@$HostName`:$Destination")
  scp @ScpArgs
}

Invoke-Remote "id -u mindbliss >/dev/null 2>&1 || sudo useradd --system --create-home --shell /sbin/nologin mindbliss"
Invoke-Remote "sudo install -d -o mindbliss -g mindbliss $ReleaseDir $RemoteRoot && sudo install -d -m 0750 -o root -g mindbliss /etc/mindbliss && sudo install -d -m 0755 /etc/caddy /var/log/caddy"

Copy-Remote $Artifact "/tmp/mindbliss-frontend.tar.gz"

if ($EnvFile) {
  Copy-Remote $EnvFile "/tmp/mindbliss-frontend.env"
  Invoke-Remote "sudo install -m 0640 -o root -g mindbliss /tmp/mindbliss-frontend.env /etc/mindbliss/frontend.env"
}

Invoke-Remote "sudo tar -xzf /tmp/mindbliss-frontend.tar.gz -C $ReleaseDir && sudo chown -R mindbliss:mindbliss $ReleaseDir"
Invoke-Remote "cd $ReleaseDir && sudo -u mindbliss npm ci && sudo -u mindbliss npm run build"
Invoke-Remote "sudo ln -sfn $ReleaseDir $RemoteRoot/current && sudo install -m 0644 $ReleaseDir/deployments/systemd/mindbliss-frontend.service /etc/systemd/system/mindbliss-frontend.service"
Invoke-Remote "sudo install -m 0644 $ReleaseDir/deployments/caddy/Caddyfile /etc/caddy/Caddyfile"
Invoke-Remote "sudo systemctl daemon-reload && sudo systemctl enable mindbliss-frontend && sudo systemctl restart mindbliss-frontend"
Invoke-Remote "if command -v caddy >/dev/null 2>&1; then sudo systemctl enable caddy && sudo systemctl reload caddy || sudo systemctl restart caddy; fi"
Invoke-Remote "sleep 2 && curl -fsS http://127.0.0.1:3000/health"

Write-Host "frontend deployed to $HostName at $ReleaseDir"
