import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Backend dizinini sys.path'e ekliyoruz ki core modülünü bulabilsin
sys.path.append(str(Path(__file__).resolve().parent.parent))

# .env dosyasını otomatik yüklüyoruz
env_path = Path(__file__).resolve().parent.parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from supabase import create_client, Client
from core.constants import BOS_ALAN_MESAJLARI

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")

def update_nulls_in_database():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ HATA: .env dosyasından SUPABASE_URL veya SUPABASE_KEY okunamadı!")
        return

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("🔄 Veritabanındaki 'programs' tablosu taranıyor...")
    
    response = supabase.table("programs").select("*").execute()
    programs = response.data
    
    if not programs:
        print("⚠️ Tabloda güncellenecek kayıt bulunamadı!")
        return

    updated_count = 0

    for program in programs:
        updates = {}
        
        # Metinsel Kolon Kontrolleri
        if not program.get("support_rate"):
            updates["support_rate"] = BOS_ALAN_MESAJLARI.get("support_rate", "Destek oranı belirtilmemiştir.")
            
        if not program.get("application_status"):
            updates["application_status"] = BOS_ALAN_MESAJLARI.get("application_status", "Başvuru durumu bilgisi bulunmuyor.")
            
        if not program.get("official_url"):
            updates["official_url"] = BOS_ALAN_MESAJLARI.get("official_url", "Resmi başvuru bağlantısı belirtilmemiştir.")
            
        if not program.get("founded_after"):
            updates["founded_after"] = "Kuruluş tarihi şartı belirtilmemiştir."

        # Boolean Kolon Kontrolleri (NULL olanları False yapıp eşleşme kilitlenmesini çözüyoruz)
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

if __name__ == "__main__":
    update_nulls_in_database()