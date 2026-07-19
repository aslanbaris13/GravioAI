"""Niyet Sınıflandırma Ajanı (SCRUM-107).

Kullanıcının son mesajını, konuşma geçmişiyle birlikte 5 niyet sınıfından
birine atar. Orchestrator bu sınıfa göre hangi ajan zincirini çalıştıracağına
karar verir (bkz. docs/chat-flow/03-prompt-akisi.md).

Sınıflandırma belirsizse (confidence eşiğin altındaysa) `profile_info`'ya
düşülür — bu, kodun geri kalanının bugüne kadarki (niyet ayrımı öncesi)
davranışıyla aynıdır, yani en güvenli varsayılandır.
"""
from models.intent import Intent, IntentResult
from models.orchestration import ConversationTurn
from .base import Agent

CONFIDENCE_THRESHOLD = 0.55


class IntentClassifier(Agent):
    name = "intent_classifier"
    system_prompt = (
        "Sen bir niyet sınıflandırıcısısın. Kullanıcının GravioAI (Türkiye'deki "
        "girişim/KOBİ destek programları asistanı) ile sohbetindeki SON mesajını, "
        "konuşma geçmişini de göz önünde bulundurarak aşağıdaki 5 kategoriden "
        "birine ata:\n\n"
        "- greeting: selamlama, teşekkür, sohbeti başlatma/bitirme (\"merhaba\", "
        "\"teşekkürler\")\n"
        "- off_topic: destek programlarıyla ilgisi olmayan mesajlar\n"
        "- profile_info: kullanıcı kendi işletmesi hakkında bilgi veriyor (sektör, "
        "şehir, ekip büyüklüğü, hedef vb.) — yeni ya da güncellenmiş profil "
        "bilgisi içerir\n"
        "- program_question: kullanıcı belirli bir program/destek türü hakkında "
        "soru soruyor, kendi profilini anlatmadan (\"Ar-Ge hibesi var mı?\")\n"
        "- apply_request: kullanıcı bir programa başvurmak/başvuru sürecini "
        "başlatmak istiyor\n\n"
        "Sadece verilen 5 kategoriden birini seç. Emin değilsen confidence'ı "
        "düşük ver."
    )

    async def run(
        self,
        message: str,
        *,
        history: list[ConversationTurn] | None = None,
    ) -> IntentResult:
        if not history:
            result = await self._extract(message, IntentResult)
        else:
            context_lines = []
            for turn in history:
                prefix = "Kullanıcı" if turn.role == "user" else "Asistan"
                context_lines.append(f"{prefix}: {turn.content}")
            context_lines.append(f"Kullanıcı (son mesaj): {message}")
            combined = (
                "Aşağıdaki konuşma geçmişini de göz önünde bulundurarak son "
                "mesajın niyetini sınıflandır.\n\n" + "\n".join(context_lines)
            )
            result = await self._extract(combined, IntentResult)

        if result.confidence < CONFIDENCE_THRESHOLD:
            return IntentResult(intent=Intent.PROFILE_INFO, confidence=result.confidence)
        return result
