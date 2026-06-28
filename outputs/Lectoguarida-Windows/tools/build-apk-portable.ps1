$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$OutputsDir = Split-Path -Parent $ProjectRoot
$WorkspaceRoot = Split-Path -Parent $OutputsDir
$ToolRoot = Join-Path $WorkspaceRoot "work\android-build-tools"
$Downloads = Join-Path $ToolRoot "downloads"
$SdkRoot = Join-Path $ToolRoot "android-sdk"
$JdkRoot = Join-Path $ToolRoot "jdk"
$GradleRoot = Join-Path $ToolRoot "gradle"
$AndroidDir = Join-Path $ProjectRoot "android"
$ApkSource = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
$ApkTarget = Join-Path $ProjectRoot "Lectoguarida-debug.apk"

$JdkUrl = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
$GradleUrl = "https://services.gradle.org/distributions/gradle-8.10.2-bin.zip"
$CmdlineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"

New-Item -ItemType Directory -Force -Path $ToolRoot, $Downloads, $SdkRoot | Out-Null

function Download-IfMissing {
  param([string]$Url, [string]$Destination)
  if (Test-Path $Destination) { return }
  Write-Host "Descargando $Url"
  Invoke-WebRequest -Uri $Url -OutFile $Destination
}

function Find-First {
  param([string]$Path, [string]$Filter)
  $item = Get-ChildItem -Path $Path -Recurse -Filter $Filter -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $item) { throw "No se encontró $Filter en $Path" }
  return $item.FullName
}

$JdkZip = Join-Path $Downloads "jdk17.zip"
$GradleZip = Join-Path $Downloads "gradle-8.10.2-bin.zip"
$CmdlineZip = Join-Path $Downloads "commandlinetools-win.zip"

Download-IfMissing $JdkUrl $JdkZip
Download-IfMissing $GradleUrl $GradleZip
Download-IfMissing $CmdlineToolsUrl $CmdlineZip

$ExistingJavac = Get-ChildItem -Path $JdkRoot -Recurse -Filter "javac.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $ExistingJavac) {
  Remove-Item $JdkRoot -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path $JdkRoot | Out-Null
  Expand-Archive -LiteralPath $JdkZip -DestinationPath $JdkRoot -Force
  $javac = Find-First $JdkRoot "javac.exe"
  $env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent $javac)
} else {
  $env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent $ExistingJavac.FullName)
}

$ExistingGradleBat = Get-ChildItem -Path $GradleRoot -Recurse -Filter "gradle.bat" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $ExistingGradleBat) {
  Remove-Item $GradleRoot -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path $GradleRoot | Out-Null
  Expand-Archive -LiteralPath $GradleZip -DestinationPath $GradleRoot -Force
  $gradleBat = Find-First $GradleRoot "gradle.bat"
  $GradleHome = Split-Path -Parent (Split-Path -Parent $gradleBat)
} else {
  $GradleHome = Split-Path -Parent (Split-Path -Parent $ExistingGradleBat.FullName)
}

$CmdlineLatest = Join-Path $SdkRoot "cmdline-tools\latest"
$SdkManager = Join-Path $CmdlineLatest "bin\sdkmanager.bat"
if (-not (Test-Path $SdkManager)) {
  $Extracted = Join-Path $ToolRoot "cmdline-extracted"
  Remove-Item $Extracted -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path $Extracted | Out-Null
  Expand-Archive -LiteralPath $CmdlineZip -DestinationPath $Extracted -Force
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $CmdlineLatest) | Out-Null
  Remove-Item $CmdlineLatest -Recurse -Force -ErrorAction SilentlyContinue
  Move-Item -LiteralPath (Join-Path $Extracted "cmdline-tools") -Destination $CmdlineLatest
}

$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:PATH = "$env:JAVA_HOME\bin;$GradleHome\bin;$SdkRoot\platform-tools;$env:PATH"

Write-Host "Instalando SDK Android necesario..."
$yes = ("y`n" * 120)
$yes | & $SdkManager --sdk_root=$SdkRoot "platform-tools" "platforms;android-35" "build-tools;35.0.0"

Write-Host "Sincronizando contenido web embebido..."
Push-Location $ProjectRoot
try {
  node tools\export-content.mjs
  node tools\sync-android-assets.mjs
} finally {
  Pop-Location
}

Write-Host "Compilando APK debug..."
Push-Location $AndroidDir
try {
  & (Join-Path $GradleHome "bin\gradle.bat") :app:assembleDebug --no-daemon
  if ($LASTEXITCODE -ne 0) { throw "Gradle falló con código $LASTEXITCODE" }
} finally {
  Pop-Location
}

if (-not (Test-Path $ApkSource)) {
  throw "La compilación terminó, pero no se encontró el APK esperado: $ApkSource"
}

Copy-Item -LiteralPath $ApkSource -Destination $ApkTarget -Force
Write-Host "APK listo: $ApkTarget"
