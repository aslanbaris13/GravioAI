import json
from pathlib import Path

def generate_jira_markdown():
    schemas_dir = Path("data/report_schemas")
    output_file = Path("JIRA_PROGRAM_DOCUMENTATION.md")
    
    markdown_content = """# 📚 GravioAI - Destek Programları Rapor Şablonları Dokümantasyonu

Bu doküman, GravioAI altyapısında tanımlı olan kamu ve uluslararası destek programlarının başvuru raporu şablonlarını (`ReportSchema`) içermektedir.

---

## 📑 İçindekiler Tablosu

| Kurum | Program Adı | Şema Kodu (`key`) |
| :--- | :--- | :--- |
"""

    json_files = sorted(schemas_dir.glob("*.json"))
    schemas_data = []

    for file_path in json_files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            schemas_data.append(data)
            markdown_content += f"| **{data.get('institution')}** | {data.get('program_name')} | `{data.get('key')}` |\n"

    markdown_content += "\n---\n\n## 🔍 Program Detayları ve Rapor Gereksinimleri\n\n"

    for idx, schema in enumerate(schemas_data, 1):
        markdown_content += f"### {idx}. {schema.get('program_name')} (`{schema.get('key')}`)\n\n"
        markdown_content += f"- **Kurum:** {schema.get('institution')}\n"
        markdown_content += f"- **Eşleşme Anahtar Kelimeleri:** `{', '.join(schema.get('match_keywords', []))}`\n"
        markdown_content += f"- **Özet:** {schema.get('summary')}\n\n"
        
        markdown_content += "#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar\n"
        for sec in schema.get("sections", []):
            markdown_content += f"##### 📌 {sec.get('title')}\n"
            markdown_content += f"_{sec.get('description')}_\n\n"
            for field in sec.get("required_fields", []):
                markdown_content += f"- **[{field.get('key')}] {field.get('label')}**\n"
                markdown_content += f"  - *Açıklama:* {field.get('description')}\n"
            markdown_content += "\n"
        
        markdown_content += "#### 📄 Zorunlu Başvuru Evrakları\n"
        for doc in schema.get("required_documents", []):
            markdown_content += f"- {doc}\n"
        
        markdown_content += "\n---\n\n"

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(markdown_content)

    print(f"✅ Jira dokümantasyonu başarıyla oluşturuldu: {output_file.resolve()}")

if __name__ == "__main__":
    generate_jira_markdown()