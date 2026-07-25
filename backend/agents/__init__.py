"""GravioAI ajanları.

Ortak desen `base.Agent`'ta (LLM-merkezli ajanlar için). Mevcut ajanlar:
* IntentClassifier — mesaj -> Intent (SCRUM-107)
* ProfileExtractor — serbest metin -> UserProfile (SCRUM-12)
* MatchingAgent — profil -> aday SupportProgram[] (RAG; LLM kullanmaz)
* EligibilityAgent — profil + program -> EligibilityResult (SCRUM-14/15)
* ApplicationAgent — profil + program -> ApplicationDraft
* MemoryAgent — oturumun profil + eşleşmelerini kalıcılaştırır (SCRUM-97)
* Orchestrator — mesaj -> AssistResult (niyete göre ajanları zincirler, SCRUM-96)
"""
from .application import ApplicationAgent
from .base import Agent
from .eligibility import EligibilityAgent
from .intent_classifier import IntentClassifier
from .matching import MatchingAgent
from .memory import MemoryAgent
from .orchestrator import Orchestrator
from .presentation_writer import PresentationWriterAgent
from .profile_extractor import ProfileExtractor
from .report_writer import ReportWriterAgent

__all__ = [
    "Agent",
    "IntentClassifier",
    "ProfileExtractor",
    "MatchingAgent",
    "MemoryAgent",
    "EligibilityAgent",
    "ApplicationAgent",
    "Orchestrator",
    "ReportWriterAgent",
    "PresentationWriterAgent",
]
