# fix_imports.ps1
# Proje kokunde (backend klasorunun disinda) calistir:
#   cd "C:\Users\ferha\OneDrive\Masaustu\GravioAI"
#   powershell -ExecutionPolicy Bypass -File .\fix_imports.ps1

$ErrorActionPreference = "Stop"

$replacements = @(
    @{ File = "backend\connectors\aws.py"; Old = "from connectors.base import BaseConnector"; New = "from backend.connectors.base import BaseConnector" }
    @{ File = "backend\connectors\aws.py"; Old = "from core.fetcher import BaseFetcher"; New = "from backend.core.fetcher import BaseFetcher" }
    @{ File = "backend\connectors\aws.py"; Old = "from core.llm.factory import get_llm_client"; New = "from backend.core.llm.factory import get_llm_client" }
    @{ File = "backend\connectors\aws.py"; Old = "from core.cleaner import BaseCleaner"; New = "from backend.core.cleaner import BaseCleaner" }

    @{ File = "backend\connectors\base.py"; Old = "from models.raw_program import RawProgram"; New = "from backend.models.raw_program import RawProgram" }
    @{ File = "backend\connectors\base.py"; Old = "from core.cleaner import BaseCleaner, get_cleaner"; New = "from backend.core.cleaner import BaseCleaner, get_cleaner" }
    @{ File = "backend\connectors\base.py"; Old = "from models.program import SupportProgram"; New = "from backend.models.program import SupportProgram" }
    @{ File = "backend\connectors\base.py"; Old = "from core.constants import AY_KISALTMALARI, BOS_ALAN_MESAJLARI, TURKCE_KARAKTER_DEGISIMLERI"; New = "from backend.core.constants import AY_KISALTMALARI, BOS_ALAN_MESAJLARI, TURKCE_KARAKTER_DEGISIMLERI" }

    @{ File = "backend\connectors\google_cloud.py"; Old = "from connectors.base import BaseConnector"; New = "from backend.connectors.base import BaseConnector" }
    @{ File = "backend\connectors\google_cloud.py"; Old = "from core.fetcher import BaseFetcher"; New = "from backend.core.fetcher import BaseFetcher" }
    @{ File = "backend\connectors\google_cloud.py"; Old = "from core.llm.factory import get_llm_client"; New = "from backend.core.llm.factory import get_llm_client" }
    @{ File = "backend\connectors\google_cloud.py"; Old = "from core.cleaner import BaseCleaner"; New = "from backend.core.cleaner import BaseCleaner" }

    @{ File = "backend\connectors\kalkinma_ajansi.py"; Old = "from core.cleaner import BaseCleaner"; New = "from backend.core.cleaner import BaseCleaner" }
    @{ File = "backend\connectors\kalkinma_ajansi.py"; Old = "from connectors.base import BaseConnector"; New = "from backend.connectors.base import BaseConnector" }
    @{ File = "backend\connectors\kalkinma_ajansi.py"; Old = "from core.fetcher import BaseFetcher"; New = "from backend.core.fetcher import BaseFetcher" }
    @{ File = "backend\connectors\kalkinma_ajansi.py"; Old = "from core.llm.factory import get_llm_client"; New = "from backend.core.llm.factory import get_llm_client" }
    @{ File = "backend\connectors\kalkinma_ajansi.py"; Old = "from core.constants import KALKINMA_AJANSI_ISIMLERI"; New = "from backend.core.constants import KALKINMA_AJANSI_ISIMLERI" }

    @{ File = "backend\connectors\kosgeb.py"; Old = "from connectors.base import BaseConnector"; New = "from backend.connectors.base import BaseConnector" }
    @{ File = "backend\connectors\kosgeb.py"; Old = "from models.raw_program import RawProgram"; New = "from backend.models.raw_program import RawProgram" }
    @{ File = "backend\connectors\kosgeb.py"; Old = "from core.cleaner import BaseCleaner,get_cleaner"; New = "from backend.core.cleaner import BaseCleaner, get_cleaner" }
    @{ File = "backend\connectors\kosgeb.py"; Old = "from core.fetcher import BaseFetcher"; New = "from backend.core.fetcher import BaseFetcher" }
    @{ File = "backend\connectors\kosgeb.py"; Old = "from core.llm.factory import get_llm_client"; New = "from backend.core.llm.factory import get_llm_client" }
    @{ File = "backend\connectors\kosgeb.py"; Old = "from models.program import SupportProgram"; New = "from backend.models.program import SupportProgram" }

    @{ File = "backend\connectors\manager.py"; Old = "from models.raw_program import RawProgram"; New = "from backend.models.raw_program import RawProgram" }
    @{ File = "backend\connectors\manager.py"; Old = "from connectors.base import BaseConnector"; New = "from backend.connectors.base import BaseConnector" }
    @{ File = "backend\connectors\manager.py"; Old = "from connectors.kalkinma_ajansi import KalkinmaAjansiConnector"; New = "from backend.connectors.kalkinma_ajansi import KalkinmaAjansiConnector" }
    @{ File = "backend\connectors\manager.py"; Old = "from connectors.tubitak import TubitakConnector"; New = "from backend.connectors.tubitak import TubitakConnector" }
    @{ File = "backend\connectors\manager.py"; Old = "from connectors.kosgeb import KOSGEBConnector"; New = "from backend.connectors.kosgeb import KOSGEBConnector" }

    @{ File = "backend\connectors\tubitak.py"; Old = "from connectors.base import BaseConnector"; New = "from backend.connectors.base import BaseConnector" }
    @{ File = "backend\connectors\tubitak.py"; Old = "from core.fetcher import BaseFetcher"; New = "from backend.core.fetcher import BaseFetcher" }
    @{ File = "backend\connectors\tubitak.py"; Old = "from core.llm.factory import get_llm_client"; New = "from backend.core.llm.factory import get_llm_client" }
    @{ File = "backend\connectors\tubitak.py"; Old = "from core.cleaner import BaseCleaner"; New = "from backend.core.cleaner import BaseCleaner" }

    @{ File = "backend\data\repo.py"; Old = "from core.config import get_settings"; New = "from backend.core.config import get_settings" }
    @{ File = "backend\data\repo.py"; Old = "from models.session import SessionState"; New = "from backend.models.session import SessionState" }

    @{ File = "backend\scripts\chunk_test.py"; Old = "from core.chunker import HierarchicalChunker"; New = "from backend.core.chunker import HierarchicalChunker" }
    @{ File = "backend\scripts\chunk_test.py"; Old = "from core.embedder import get_embedding_client"; New = "from backend.core.embedder import get_embedding_client" }

    @{ File = "backend\scripts\ingest.py"; Old = "from core.embedder import get_embedding_client"; New = "from backend.core.embedder import get_embedding_client" }
    @{ File = "backend\scripts\ingest.py"; Old = "from core.chunker import HierarchicalChunker"; New = "from backend.core.chunker import HierarchicalChunker" }

    @{ File = "backend\scripts\scrape.py"; Old = "from connectors.kosgeb import KOSGEBConnector"; New = "from backend.connectors.kosgeb import KOSGEBConnector" }
    @{ File = "backend\scripts\scrape.py"; Old = "from connectors.kalkinma_ajansi import KalkinmaAjansiConnector"; New = "from backend.connectors.kalkinma_ajansi import KalkinmaAjansiConnector" }
    @{ File = "backend\scripts\scrape.py"; Old = "from connectors.tubitak import TubitakConnector"; New = "from backend.connectors.tubitak import TubitakConnector" }
    @{ File = "backend\scripts\scrape.py"; Old = "from connectors.manager import ConnectorManager"; New = "from backend.connectors.manager import ConnectorManager" }
    @{ File = "backend\scripts\scrape.py"; Old = "from connectors.google_cloud import GoogleCloudConnector"; New = "from backend.connectors.google_cloud import GoogleCloudConnector" }
    @{ File = "backend\scripts\scrape.py"; Old = "from connectors.aws import AwsConnector"; New = "from backend.connectors.aws import AwsConnector" }

    @{ File = "backend\tests\test_connectors_base.py"; Old = "from connectors.base import BaseConnector, _normalize_deadline  # noqa: E402"; New = "from backend.connectors.base import BaseConnector, _normalize_deadline  # noqa: E402" }
    @{ File = "backend\tests\test_connectors_base.py"; Old = "from models.program import ExtractedSupportInfo  # noqa: E402"; New = "from backend.models.program import ExtractedSupportInfo  # noqa: E402" }
)

$changed = 0
$missing = 0
$notfound = 0

foreach ($r in $replacements) {
    $path = $r.File
    if (-not (Test-Path $path)) {
        Write-Host "DOSYA YOK: $path" -ForegroundColor Red
        $missing++
        continue
    }
    $content = Get-Content -Raw -Path $path
    if ($content.Contains($r.Old)) {
        $content = $content.Replace($r.Old, $r.New)
        Set-Content -Path $path -Value $content -NoNewline
        Write-Host "OK: $path -> $($r.Old)" -ForegroundColor Green
        $changed++
    } else {
        Write-Host "BULUNAMADI (satir farkli olabilir): $path -> $($r.Old)" -ForegroundColor Yellow
        $notfound++
    }
}

Write-Host ""
Write-Host "Toplam degistirilen: $changed, dosya bulunamayan: $missing, satir bulunamayan: $notfound"

# __init__.py kontrolu - eksikse olustur
$dirsNeedingInit = @("backend", "backend\connectors", "backend\core", "backend\core\llm", "backend\models", "backend\data", "backend\scripts", "backend\tests", "backend\agents", "backend\api")
foreach ($d in $dirsNeedingInit) {
    $initPath = Join-Path $d "__init__.py"
    if ((Test-Path $d) -and (-not (Test-Path $initPath))) {
        New-Item -Path $initPath -ItemType File -Force | Out-Null
        Write-Host "OLUSTURULDU: $initPath" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "Simdi calistirmayi dene:" -ForegroundColor Magenta
Write-Host '  $env:PYTHONPATH = "."'
Write-Host "  python -m backend.scripts.scrape google aws"
