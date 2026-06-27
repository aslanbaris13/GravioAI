"""GravioAI ajanları.

Ortak desen `base.Agent`'ta. Mevcut ajanlar:
* ProfileExtractor — serbest metin -> UserProfile (SCRUM-12)

Sıradakiler: MatchingAgent (RAG), EligibilityAgent, ApplicationAgent, Orchestrator.
"""
from .base import Agent
from .profile_extractor import ProfileExtractor

__all__ = ["Agent", "ProfileExtractor"]
