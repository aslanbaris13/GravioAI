# fix_imports_v2.ps1
# Bu script "backend." onekini KALDIRIR ve backend klasorunu PYTHONPATH koku
# olarak kullanacak sekilde importlari duzenler.
#
# Proje kokunde calistir:
#   cd "C:\Users\ferha\OneDrive\Masaustu\GravioAI"
#   powershell -ExecutionPolicy Bypass -File .\fix_imports_v2.ps1
#
# Calistirdiktan sonra script su sekilde kullanilacak:
#   cd backend
#   $env:PYTHONPATH = "."
#   python -m scripts.scrape google aws

$ErrorActionPreference = "Stop"

if (-not (Test-Path "backend")) {
    Write-Host "HATA: 'backend' klasoru bulunamadi. Bu scripti proje kokunde calistirmalisin." -ForegroundColor Red
    exit 1
}

$pyFiles = Get-ChildItem -Path backend -Recurse -Filter *.py | Where-Object { $_.FullName -notmatch '\\\.venv\\' }

$totalChanges = 0

foreach ($file in $pyFiles) {
    $path = $file.FullName
    $content = Get-Content -Raw -Path $path
    $original = $content

    # 1) "backend." onekini kaldir: from backend.connectors.X -> from connectors.X
    $content = $content -replace 'from backend\.(connectors|core|models|data|agents|api|scripts|tests)\.', 'from $1.'
    $content = $content -replace 'from backend\.(connectors|core|models|data|agents|api|scripts|tests) import', 'from $1 import'

    # 2) agents/*.py ve api/routes.py icindeki ".." (parent package) importlarini
    #    noktasiz absolute hale getir: from ..models.X import Y  ->  from models.X import Y
    if ($path -match '\\agents\\' -or $path -match '\\api\\routes\.py$') {
        $content = $content -replace 'from \.\.(\w)', 'from $1'
    }

    # 3) core/llm/base.py ve gemini_client.py: "..." (3 nokta) -> noktasiz
    if ($path -match '\\core\\llm\\base\.py$' -or $path -match '\\core\\llm\\gemini_client\.py$') {
        $content = $content -replace 'from \.\.\.(\w)', 'from $1'
    }

    if ($content -ne $original) {
        Set-Content -Path $path -Value $content -NoNewline
        Write-Host "GUNCELLENDI: $($path.Substring($path.IndexOf('backend')))" -ForegroundColor Green
        $totalChanges++
    }
}

Write-Host ""
Write-Host "Toplam guncellenen dosya: $totalChanges"
Write-Host ""

# Kalan supheli satirlari goster (kontrol amacli)
Write-Host "Kontrol: kalan onek/nokta sorunlu satirlar (bos ise temiz demektir):" -ForegroundColor Cyan
Get-ChildItem -Path backend -Recurse -Filter *.py | Where-Object { $_.FullName -notmatch '\\\.venv\\' } | `
    Select-String -Pattern "^from backend\.|^from \.\.\.?\w" | `
    ForEach-Object { Write-Host $_.Path.Substring($_.Path.IndexOf('backend')) ":" $_.LineNumber ":" $_.Line -ForegroundColor Yellow }

Write-Host ""
Write-Host "Simdi backend klasorune girip su sekilde calistir:" -ForegroundColor Magenta
Write-Host "  cd backend"
Write-Host '  $env:PYTHONPATH = "."'
Write-Host "  python -m scripts.scrape google aws"
