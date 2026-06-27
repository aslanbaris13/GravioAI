"""GravioAI ajanları.

Ortak desen `base.Agent`'ta (LLM-merkezli ajanlar için). Mevcut ajanlar:
* ProfileExtractor — serbest metin -> UserProfile (SCRUM-12)
* MatchingAgent — profil -> aday SupportProgram[] (RAG; LLM kullanmaz)
* EligibilityAgent — profil + program -> EligibilityResult (SCRUM-14/15)

Sıradakiler: ApplicationAgent, Orchestrator.
"""
from .base import Agent
from .eligibility import EligibilityAgent
from .matching import MatchingAgent
from .profile_extractor import ProfileExtractor

__all__ = ["Agent", "ProfileExtractor", "MatchingAgent", "EligibilityAgent"]
