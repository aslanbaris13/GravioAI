"""
scripts/load_cloud_to_supabase.py

Google Cloud ve AWS taslak JSON dosyalarını okur, projenin kendi 'repo.py' 
altyapısını kullanır ve aynı paketteki mükerrer ID'leri temizleyerek içeri yazar.
"""
import json
import os
import sys
from dotenv import load_dotenv

try:
    from data.repo import upsert_programs
except ImportError as e:
    print(f"❌ Entegrasyon Hatası: 'data.repo' içinden 'upsert_programs' yüklenemedi: {e}")
    sys.exit(1)

TASLAK_DOSYALAR = {
    "Google Cloud": "data/programs/google_taslak.json",
    "AWS": "data/programs/aws_taslak.json"
}

def load_to_supabase():
    print("🚀 Projenin orijinal 'upsert_programs' motoru tetikleniyor...\n")
    load_dotenv()

    for kaynak_adi, dosya_adi in TASLAK_DOSYALAR.items():
        if not os.path.exists(dosya_adi):
            print(f"⚠️ UYARI: Taslak dosyası bulunamadı: {dosya_adi}")
            continue

        with open(dosya_adi, "r", encoding="utf-8") as f:
            programs_json = json.load(f)

        if not programs_json:
            continue

        print(f"🔄 {kaynak_adi}: {len(programs_json)} program şemaya göre hazırlanıyor...")
        
        # SQL hatasını engellemek için aynı paket içindeki benzersiz programları tutacağımız dict
        unique_rows = {}
        
        for p in programs_json:
            if "id" in p:
                del p["id"]

            program_id = p.get("program_id") or f"{kaynak_adi.lower()}-program"
            
            row = {
                "program_id": program_id,
                "title": p.get("title", f"{kaynak_adi} Destek Programı"),
                "body_chunk": p.get("body_chunk") or p.get("description", "Açıklama bulunamadı."),
                "chunk_index": int(p.get("chunk_index", 0)),
                "source": kaynak_adi,
                "category": p.get("category", "Kamu Destekleri"),
                "embedding": p.get("embedding") or ([0.0] * 768) 
            }
            
            # Eğer bu ID daha önce eklenmişse üzerine yazar, böylece listede duplicate kalmaz kanka
            unique_rows[program_id] = row

        db_rows = list(unique_rows.values())

        if db_rows:
            try:
                yazilan_adet = upsert_programs(db_rows)
                print(f"✅ {kaynak_adi} başarıyla tamamlandı: {yazilan_adet}/{len(db_rows)} benzersiz kayıt 'programs_v2' tablosuna yazıldı. (Çakışan {len(programs_json) - len(db_rows)} adet elendi)\n")
            except Exception as e:
                print(f"❌ {kaynak_adi} yüklenirken DB hatası oldu: {e}")

if __name__ == "__main__":
    load_to_supabase()