export const metadata = {
  title: "Aydınlatma Metni — GravioAI",
};

export default function AydinlatmaMetniPage() {
  return (
    <section style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 32px 80px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 6px", letterSpacing: "-.01em" }}>
          Kişisel Verilerin Korunması Kanunu Kapsamında Aydınlatma Metni
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-400)", margin: "0 0 28px" }}>
          6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") madde 10 uyarınca hazırlanmıştır. Son güncelleme: 17 Temmuz 2026.
        </p>

        <Legal>
          <H>1. Veri Sorumlusunun Kimliği</H>
          <P>
            İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("<B>KVKK</B>") kapsamında veri sorumlusu
            sıfatıyla <B>GravioAI</B> ("<B>Şirket</B>" veya "<B>GravioAI</B>") tarafından, GravioAI web ve mobil uygulaması
            ("<B>Platform</B>") üzerinden topladığımız kişisel verilerin işlenmesine ilişkin usul ve esaslar hakkında sizi
            bilgilendirmek amacıyla hazırlanmıştır.
          </P>
          <Note>
            GravioAI şu an bir bootcamp/geliştirme projesi olarak yürütülmektedir ve tüzel kişilik olarak henüz tescil
            edilmemiştir. Platform ticari olarak yayına alınmadan önce bu bölüme şirketin tam unvanı, MERSİS numarası, vergi
            kimlik numarası, tescilli adresi ve KEP adresi eklenmelidir.
          </Note>

          <H>2. İşlenen Kişisel Veri Kategorileri</H>
          <P>Platform üzerinden aşağıdaki kişisel veri kategorileri işlenmektedir:</P>
          <Ul
            items={[
              <><B>Kimlik ve iletişim verisi:</B> ad-soyad, işletme unvanı, şehir, e-posta (hesap oluşturulması hâlinde).</>,
              <><B>İşletme profili verisi:</B> sektör, kuruluş yılı, ekip büyüklüğü, hedefler, kadın girişimci/öğrenci/teknopark
              durumu gibi sohbet veya onboarding akışı üzerinden paylaştığınız bilgiler.</>,
              <><B>Başvuru ve rapor verisi:</B> destek/hibe başvurusu ya da rapor hazırlığı için paylaştığınız proje özeti,
              bütçe kalemleri, iş planı ve benzeri belge içerikleri.</>,
              <><B>İşlem güvenliği verisi:</B> oturum kimliği, IP adresi, tarayıcı/cihaz bilgisi, erişim zaman damgaları.</>,
            ]}
          />

          <H>3. Kişisel Verilerin İşlenme Amaçları</H>
          <P>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</P>
          <Ul
            items={[
              "İşletmenize uygun kamu/özel sektör destek programlarının eşleştirilmesi ve uygunluk değerlendirmesi yapılması,",
              "Başvuru taslağı, rapor ve sunum gibi çıktıların hazırlanması,",
              "Oturumunuzun ve profilinizin farklı ziyaretler arasında hatırlanması,",
              "Platform güvenliğinin sağlanması, kötüye kullanımın önlenmesi ve hizmet kalitesinin izlenmesi,",
              "Yasal yükümlülüklerin yerine getirilmesi.",
            ]}
          />

          <H>4. Kişisel Verilerin Aktarılması</H>
          <P>
            Kişisel verileriniz, hizmetin sunulabilmesi için gerekli ölçüde ve aşağıda belirtilen taraflarla paylaşılmaktadır:
          </P>
          <Ul
            items={[
              <><B>Barındırma ve veritabanı hizmeti (Supabase):</B> profil, oturum ve rapor verilerinizin güvenli şekilde
              saklanması amacıyla.</>,
              <><B>Yapay zekâ dil modeli sağlayıcısı (Google Gemini):</B> mesajlarınızdan işletme profili çıkarımı, program
              eşleştirmesi ve rapor/metin üretimi amacıyla mesaj içeriğiniz bu sağlayıcıya iletilir. Bu aktarım, KVKK'nın
              yurt dışına veri aktarımına ilişkin hükümleri kapsamında değerlendirilmektedir.</>,
            ]}
          />
          <Note>
            Yurt dışı aktarımın hukuki dayanağı (açık rıza veya KVKK m.9'da sayılan istisnalar) ve Google'ın ilgili veri
            işleme sözleşmesi/sertifikasyonları, Platform ticari olarak yayına alınmadan önce hukuki danışmanla birlikte
            netleştirilip bu bölüme eklenmelidir.
          </Note>

          <H>5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</H>
          <P>
            Kişisel verileriniz; onboarding akışı, sohbet arayüzü ve form alanları aracılığıyla, elektronik ortamda,
            doğrudan sizin tarafınızdan sağlanmak suretiyle toplanmaktadır. Verileriniz; KVKK madde 5/2 kapsamındaki
            "bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması" ve "veri sorumlusunun meşru menfaati"
            hukuki sebeplerine, yurt dışına aktarılan veriler ile hassas nitelikteki başvuru/rapor verileri bakımından ise
            <B> açık rızanıza</B> dayanılarak işlenmektedir.
          </P>

          <H>6. İlgili Kişi Olarak Haklarınız (KVKK m.11)</H>
          <P>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</P>
          <Ul
            items={[
              "Kişisel verinizin işlenip işlenmediğini öğrenme,",
              "İşlenmişse buna ilişkin bilgi talep etme,",
              "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
              "Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,",
              "Eksik/yanlış işlenmişse düzeltilmesini isteme,",
              "KVKK'da öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme,",
              "Aktarıldığı üçüncü kişilere yukarıdaki işlemlerin bildirilmesini isteme,",
              "Münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,",
              "Kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.",
            ]}
          />
          <P>
            Bu haklarınızı kullanmak için Ayarlar sayfasındaki "Verilerimi indir" ve "Hesabımı/verilerimi sil"
            araçlarını kullanabilir, ya da bize ulaşabilirsiniz.
          </P>

          <H>7. Veri Saklama Süresi</H>
          <P>
            Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen zamanaşımı
            süreleri saklı kalmak kaydıyla saklanır. Hesabınızı sildiğinizde profil, oturum ve rapor verileriniz makul
            bir süre içinde sistemlerimizden kalıcı olarak silinir.
          </P>
        </Legal>
      </div>
    </section>
  );
}

function Legal({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-900)" }}>{children}</div>;
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)", margin: "26px 0 8px" }}>{children}</h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 12px" }}>{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
  return <b style={{ fontWeight: 700, color: "var(--ink-900)" }}>{children}</b>;
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: "0 0 12px", paddingLeft: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--warn-100)",
        border: "1px solid var(--warn-200)",
        borderRadius: 10,
        padding: "12px 14px",
        fontSize: 12.5,
        color: "var(--warn-700)",
        margin: "0 0 16px",
        lineHeight: 1.55,
      }}
    >
      <b>Not:</b> {children}
    </div>
  );
}
