import { describe, expect, it } from "vitest";
import {
  adaptApplicationDraft,
  adaptAssistResult,
  adaptProgram,
  adaptSessionState,
  profileToChips,
} from "./adapter";
import type {
  BackendApplicationDraft,
  BackendEligibilityResult,
  BackendSupportProgram,
  BackendUserProfile,
} from "./api";

function program(overrides: Partial<BackendSupportProgram> = {}): BackendSupportProgram {
  return {
    program_id: "p1",
    title: "Teknoloji Merkezi Destek Programı",
    category: "Kamu Destekleri",
    source: "KOSGEB",
    support_type: "Hibe",
    amount_min: null,
    amount_max: null,
    currency: null,
    support_rate: null,
    application_status: null,
    region: null,
    founded_after: null,
    deadline: null,
    official_url: null,
    conditions_summary: null,
    women_entrepreneur: null,
    technopark: null,
    company_required: null,
    student: null,
    ...overrides,
  };
}

function eligibility(overrides: Partial<BackendEligibilityResult> = {}): BackendEligibilityResult {
  return {
    state: "partial",
    score: 70,
    label: "1 koşul eksik",
    conditions: [],
    ...overrides,
  };
}

describe("adaptProgram — tutar formatlama", () => {
  it("tutar hiç yoksa 'Belirtilmemiş' gösterir", () => {
    const p = adaptProgram(program(), eligibility());
    expect(p.hasAmount).toBe(false);
    expect(p.amountText).toBe("Belirtilmemiş");
  });

  it("tek tutar varsa formatlanmış tek değer gösterir", () => {
    const p = adaptProgram(program({ amount_max: 65_060_000 }), eligibility());
    expect(p.hasAmount).toBe(true);
    expect(p.amountText).toContain("65,1 M");
  });

  it("min ve max farklıysa aralık gösterir", () => {
    const p = adaptProgram(program({ amount_min: 19_518_000, amount_max: 65_060_000 }), eligibility());
    expect(p.amountText).toContain("–");
  });
});

describe("adaptProgram — son başvuru tarihi", () => {
  it("tarih yoksa 'Belirtilmemiş' gösterir", () => {
    const p = adaptProgram(program({ deadline: null }), eligibility());
    expect(p.deadlineText).toBe("Belirtilmemiş");
    expect(p.deadlineDays).toBeNull();
  });

  it("backend'in gönderdiği açıklayıcı metni (geçersiz tarih) olduğu gibi gösterir, 'Invalid Date' yazmaz", () => {
    const p = adaptProgram(program({ deadline: "Son başvuru tarihi belirtilmemiş" }), eligibility());
    expect(p.deadlineText).toBe("Son başvuru tarihi belirtilmemiş");
    expect(p.deadlineText).not.toContain("Invalid Date");
    expect(p.deadlineDays).toBeNull();
  });

  it("geçerli gelecek tarih için gün sayısını hesaplar", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const p = adaptProgram(program({ deadline: future.toISOString().slice(0, 10) }), eligibility());
    expect(p.deadlineDays).toBeGreaterThanOrEqual(9);
    expect(p.deadlineDays).toBeLessThanOrEqual(10);
  });
});

describe("adaptProgram — temel kriterler", () => {
  it("hiçbir alan yoksa boş liste döner", () => {
    const p = adaptProgram(program(), eligibility());
    expect(p.criteria).toEqual([]);
  });

  it("region, company_required ve founded_after'dan kriter üretir", () => {
    const p = adaptProgram(
      program({ region: "Ulusal", company_required: true, founded_after: "3 yaşından küçük olmalı" }),
      eligibility(),
    );
    const labels = p.criteria.map((c) => c.label);
    expect(labels).toContain("Bölge");
    expect(labels).toContain("Şirket şartı");
    expect(labels).toContain("Kuruluş şartı");
  });

  it("founded_after backend'in boş-alan mesajıysa kriter listesine eklenmez", () => {
    const p = adaptProgram(
      program({ founded_after: "Kuruluş tarihi şartı belirtilmemiş" }),
      eligibility(),
    );
    expect(p.criteria.some((c) => c.label === "Kuruluş şartı")).toBe(false);
  });

  it("women_entrepreneur/student/technopark yalnızca true ise kritere eklenir", () => {
    const p = adaptProgram(
      program({ women_entrepreneur: true, student: false, technopark: null }),
      eligibility(),
    );
    const labels = p.criteria.map((c) => c.label);
    expect(labels).toContain("Kadın girişimci");
    expect(labels).not.toContain("Öğrenci");
    expect(labels).not.toContain("Teknopark");
  });

  it("company_required false olsa bile (boolean anlamlı) kritere eklenir", () => {
    const p = adaptProgram(program({ company_required: false }), eligibility());
    const sirketKriteri = p.criteria.find((c) => c.label === "Şirket şartı");
    expect(sirketKriteri?.value).toBe("Şirket şartı yok");
  });
});

describe("profileToChips", () => {
  it("boş profil için boş liste döner", () => {
    const chips = profileToChips({ goals: [] });
    expect(chips).toEqual([]);
  });

  it("dolu alanlar için sırasıyla chip üretir", () => {
    const profile: BackendUserProfile = {
      sector: "Yazılım",
      city: "Düzce",
      team_size: 3,
      goals: ["Ar-Ge hibesi", "İstihdam"],
    };
    const chips = profileToChips(profile);
    expect(chips.find((c) => c.label === "Sektör")?.value).toBe("Yazılım");
    expect(chips.find((c) => c.label === "İl")?.value).toBe("Düzce");
    expect(chips.find((c) => c.label === "Ekip")?.value).toBe("3 kişi");
    expect(chips.find((c) => c.label === "Hedef")?.value).toBe("Ar-Ge hibesi, İstihdam");
  });
});

describe("adaptAssistResult / adaptSessionState", () => {
  it("matches'i Program listesine çevirir, reply'yi korur", () => {
    const raw = {
      profile: { goals: [] },
      matches: [{ program: program(), eligibility: eligibility() }],
      reply: "Merhaba",
    };
    const { programs, reply } = adaptAssistResult(raw);
    expect(programs).toHaveLength(1);
    expect(programs[0].id).toBe("p1");
    expect(reply).toBe("Merhaba");
  });

  it("adaptSessionState reply alanı olmadan aynı dönüşümü yapar", () => {
    const raw = {
      profile: { goals: [] },
      matches: [{ program: program(), eligibility: eligibility() }],
    };
    const { programs } = adaptSessionState(raw);
    expect(programs).toHaveLength(1);
  });
});

describe("adaptApplicationDraft", () => {
  it("otomatik belgeleri 'done' işaretler, manuel belgeleri işaretlemez", () => {
    const raw: BackendApplicationDraft = {
      program_name: "BİGG",
      plan_title: "İş Planı",
      plan_sections: [{ heading: "Özet", body: "..." }],
      documents: [
        { label: "İş planı", auto: true },
        { label: "Nüfus kayıt örneği", auto: false },
      ],
    };
    const draft = adaptApplicationDraft(raw);
    expect(draft.docs[0].done).toBe(true);
    expect(draft.docs[1].done).toBe(false);
    expect(draft.programName).toBe("BİGG");
  });
});
