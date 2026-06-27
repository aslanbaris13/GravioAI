"""GravioAI ajanları.

Ortak desen `base.Agent`'ta. Mevcut ajanlar:
* ProfileExtractor — serbest metin -> UserProfile (SCRUM-12)
* EligibilityAgent — profil + program -> EligibilityResult (SCRUM-14/15)

Sıradakiler: MatchingAgent (RAG sarmalı), ApplicationAgent, Orchestrator.
"""
from .base import Agent
from .eligibility import EligibilityAgent
from .profile_extractor import ProfileExtractor

__all__ = ["Agent", "ProfileExtractor", "EligibilityAgent"]
