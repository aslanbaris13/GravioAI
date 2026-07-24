import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Backend dizinini sys.path'e ekliyoruz
sys.path.append(str(Path(__file__).resolve().parent.parent))

# .env dosyasını yüklüyoruz
env_path = Path(__file__).resolve().parent.parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from supabase import create_client, Client
from core.constants import BOS_ALAN_MESAJLARI

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

def update_nulls_in_database():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ HATA: .env dosyasından SUPABASE_URL veya yazma yetkili SUPABASE_KEY okunamadı!")
        return

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("🔄 Veritabanındaki 'programs' tablosu taranıyor...")
        
        columns_to_select = [
            "id",
            "program_id",
            "support_rate",
            "application_status",
            "official_url",
            "founded_after",
            "women_entrepreneur",
            "technopark",
            "student",
            "company_required"
        ]
        
        response = supabase.table("programs").select(",".join(columns_to_select)).execute()
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