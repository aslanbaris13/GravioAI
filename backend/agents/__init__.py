"""GravioAI ajanları.

Ortak desen `base.Agent`'ta (LLM-merkezli ajanlar için). Mevcut ajanlar:
* ProfileExtractor — serbest metin -> UserProfile (SCRUM-12)
* MatchingAgent — profil -> aday SupportProgram[] (RAG; LLM kullanmaz)
* EligibilityAgent — profil + program -> EligibilityResult (SCRUM-14/15)
* ApplicationAgent — profil + program -> ApplicationDraft
* Orchestrator — mesaj -> AssistResult (ajanları zincirler)
"""
from .application import ApplicationAgent
from .base import Agent
from .eligibility import EligibilityAgent
from .matching import MatchingAgent
from .orchestrator import Orchestrator
from .profile_extractor import ProfileExtractor

__all__ = [
    "Agent",
    "ProfileExtractor",
    "MatchingAgent",
    "EligibilityAgent",
    "ApplicationAgent",
    "Orchestrator",
]
