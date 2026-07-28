export const metadata = {
  title: "Açık Rıza Metni — GravioAI",
};

export default function KvkkRizaPage() {
  return (
    <section style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 32px 80px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 6px", letterSpacing: "-.01em" }}>
          Açık Rıza Metni
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-400)", margin: "0 0 28px" }}>
          6698 sayılı KVKK kapsamında, aşağıdaki işlemler için ayrı ayrı açık rızanız alınır. Son güncelleme: 17 Temmuz 2026.
        </p>

        <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-900)" }}>
          <p style={{ margin: "0 0 16px" }}>
            <a href="/legal/aydinlatma-metni" style={{ color: "var(--terracotta-700)" }}>Aydınlatma Metni</a>'nde açıklanan kapsam ve
            amaçlarla sınırlı olmak üzere, aşağıdaki iki rıza birbirinden bağımsızdır — birini reddetmeniz diğerini
            etkilemez.
          </p>

          <Block title="A. Onboarding / Profil Rızası">
            <P>
              Sektör, şehir, ekip büyüklüğü, hedefler ve benzeri işletme profili bilgilerimin; bana uygun devlet ve
              özel sektör destek programlarının eşleştirilmesi, uygunluk değerlendirmesi yapılması ve bu değerlendirme
              sürecinde yapay zekâ dil modeli sağlayıcısına (Google Gemini) yurt dışına aktarılması dâhil olmak üzere
              işlenmesine, <B>açık rızam</B> ile onay veriyorum.
            </P>
          </Block>

          <Block title="B. Başvuru / Rapor Verisi Rızası">
            <P>
              Bir destek/hibe programına başvuru raporu veya sunum hazırlamak amacıyla paylaştığım proje özeti, bütçe
              kalemleri, iş planı, ekip bilgileri ve benzeri içeriklerin; rapor/sunum taslağının yapay zekâ dil modeli
              (Google Gemini) yardımıyla üretilmesi amacıyla işlenmesine ve bu amaçla yurt dışına aktarılmasına, <B>açık
              rızam</B> ile onay veriyorum.
            </P>
            <P>
              Bu rızayı vermemem hâlinde rapor/sunum üretim özelliğini kullanamam; profil eşleştirme ve sohbet
              özellikleri bundan etkilenmez.
            </P>
          </Block>

          <p style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: 24 }}>
            Rızalarınızı dilediğiniz zaman Ayarlar sayfasından geri çekebilir, verilerinizin silinmesini talep
            edebilirsiniz. Rızanın geri çekilmesi, geri çekilme öncesinde yapılan işlemlerin hukuka uygunluğunu
            etkilemez.
          </p>
        </div>
      </div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: "16px 18px",
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 8px" }}>{title}</h2>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 8px" }}>{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
  return <b style={{ fontWeight: 700, color: "var(--ink-900)" }}>{children}</b>;
}
