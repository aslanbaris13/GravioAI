import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Backend dizinini sys.path'e ekliyoruz
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# .env dosyasını yüklüyoruz
env_path = BACKEND_DIR / ".env"
if not env_path.exists():
    env_path = BACKEND_DIR.parent / ".env"
load_dotenv(dotenv_path=env_path)

from supabase import create_client, Client
from core.constants import BOS_ALAN_MESAJLARI

RAW_SUPABASE_URL = os.getenv("SUPABASE_URL", "")

# Anon key'e düşmeyerek güvenliği sağlıyoruz (Sourcery Comment 1)
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

# Python SDK /rest/v1'i otomatik eklediği için URL sonundaki takıyı temizliyoruz (PGRST125 fix)
SUPABASE_URL = RAW_SUPABASE_URL.replace("/rest/v1", "").rstrip("/")

def update_nulls_in_database():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ HATA: .env dosyasından SUPABASE_URL veya yazma yetkili SUPABASE_KEY okunamadı!")
        return

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("🔄 Veritabanındaki 'programs' tablosu taranıyor...")
        
        # PostgREST URL ayrıştırma hatasını önlemek için standart select
        response = supabase.table("programs").select("*").execute()
        programs = response.data
        
        if not programs:
            print("⚠️ Tabloda güncellenecek kayıt bulunamadı!")
            return

        updated_count = 0

        for program in programs:
            updates = {}
            
            if not program.get("support_rate"):
                updates["support_rate"] = BOS_ALAN_MESAJLARI.get("support_rate", "Destek oranı belirtilmemiştir.")
                
            if not program.get("application_status"):
                updates["application_status"] = BOS_ALAN_MESAJLARI.get("application_status", "Başvuru durumu bilgisi bulunmuyor.")
                
            if not program.get("official_url"):
                updates["official_url"] = BOS_ALAN_MESAJLARI.get("official_url", "Resmi başvuru bağlantısı belirtilmemiştir.")
                
            # Sourcery Comment 3: founded_after artık sabitten okunuyor
            if not program.get("founded_after"):
                updates["founded_after"] = BOS_ALAN_MESAJLARI.get("founded_after", "Kuruluş tarihi şartı belirtilmemiştir.")

            if program.get("women_entrepreneur") is None:
                updates["women_entrepreneur"] = False
                
            if program.get("technopark") is None:
                updates["technopark"] = False
                
            if program.get("student") is None:
                updates["student"] = False
                
            if program.get("company_required") is None:
                updates["company_required"] = False

            if updates:
                supabase.table("programs").update(updates).eq("id", program["id"]).execute()
                updated_count += 1
                print(f"✅ Program ID: {program.get('program_id', program['id'])} güncellendi.")

        print(f"\n🎉 İşlem Tamamlandı! Toplam {updated_count} satırdaki NULL değerler temizlendi.")

    except Exception as e:
        print(f"❌ İşlem sırasında bir hata oluştu: {str(e)}")

if __name__ == "__main__":
    update_nulls_in_database()