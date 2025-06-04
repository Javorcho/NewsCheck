from typing import Dict, Any, Optional
import requests
from newspaper import Article
from bs4 import BeautifulSoup
import nltk
from transformers import pipeline
import spacy
from datetime import datetime

class NewsVerificationService:
    def __init__(self):
        # Download required NLTK data
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        
        # Initialize the ML model for text classification
        self.classifier = pipeline("text-classification", model="facebook/roberta-hate-speech-dynabench-r4-target")
        
        # Load spaCy model for NLP tasks
        self.nlp = spacy.load("en_core_web_sm")
        
    def verify_news(self, content: str, url: Optional[str] = None) -> Dict[str, Any]:
        """
        Verify a news article by analyzing its content and metadata.
        
        Args:
            content (str): The text content of the news article
            url (Optional[str]): The URL of the news article if available
            
        Returns:
            Dict[str, Any]: Verification results including reliability score and analysis
        """
        # Extract article metadata if URL is provided
        metadata = self._extract_metadata(url) if url else {}
        
        # Analyze the content
        content_analysis = self._analyze_content(content)
        
        # Combine results
        verification_result = {
            "reliability_score": self._calculate_reliability_score(content_analysis, metadata),
            "content_analysis": content_analysis,
            "metadata": metadata,
            "timestamp": datetime.utcnow().isoformat(),
            "verification_status": self._determine_verification_status(content_analysis, metadata)
        }
        
        return verification_result
    
    def _extract_metadata(self, url: str) -> Dict[str, Any]:
        """Extract metadata from the article URL."""
        try:
            article = Article(url)
            article.download()
            article.parse()
            
            return {
                "title": article.title,
                "authors": article.authors,
                "publish_date": article.publish_date.isoformat() if article.publish_date else None,
                "source_domain": article.domain,
                "keywords": article.keywords,
                "summary": article.summary
            }
        except Exception as e:
            return {"error": str(e)}
    
    def _analyze_content(self, content: str) -> Dict[str, Any]:
        """Analyze the content of the article."""
        # Perform sentiment analysis
        sentiment = self.classifier(content)[0]
        
        # Extract named entities
        doc = self.nlp(content)
        entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
        
        # Extract key phrases
        sentences = nltk.sent_tokenize(content)
        
        return {
            "sentiment": sentiment,
            "entities": entities,
            "sentence_count": len(sentences),
            "word_count": len(content.split()),
            "key_phrases": self._extract_key_phrases(content)
        }
    
    def _extract_key_phrases(self, text: str) -> list:
        """Extract key phrases from the text."""
        doc = self.nlp(text)
        key_phrases = []
        
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) > 1:  # Only include multi-word phrases
                key_phrases.append(chunk.text)
        
        return key_phrases
    
    def _calculate_reliability_score(self, content_analysis: Dict[str, Any], metadata: Dict[str, Any]) -> float:
        """Calculate a reliability score based on content analysis and metadata."""
        score = 0.5  # Start with a neutral score
        
        # Adjust score based on content analysis
        if content_analysis["sentiment"]["label"] == "nothate":
            score += 0.1
        
        # Adjust score based on metadata
        if metadata.get("authors"):
            score += 0.1
        if metadata.get("publish_date"):
            score += 0.1
        if metadata.get("keywords"):
            score += 0.1
            
        # Normalize score to be between 0 and 1
        return min(max(score, 0.0), 1.0)
    
    def _determine_verification_status(self, content_analysis: Dict[str, Any], metadata: Dict[str, Any]) -> str:
        """Determine the verification status based on analysis results."""
        reliability_score = self._calculate_reliability_score(content_analysis, metadata)
        
        if reliability_score >= 0.8:
            return "VERIFIED"
        elif reliability_score >= 0.6:
            return "LIKELY_TRUE"
        elif reliability_score >= 0.4:
            return "UNCERTAIN"
        elif reliability_score >= 0.2:
            return "LIKELY_FALSE"
        else:
            return "MISINFORMATION" 