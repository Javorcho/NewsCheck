from transformers import pipeline
from newspaper import Article
from bs4 import BeautifulSoup
import requests
import nltk
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from typing import Dict, Tuple, List
import re
from urllib.parse import urlparse
import logging

# Download required NLTK data
try:
    nltk.data.find('punkt')
except LookupError:
    nltk.download('punkt')

# Initialize models
nlp = spacy.load('en_core_web_sm')
sentiment_analyzer = pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')
fake_news_classifier = pipeline('text-classification', model='rajpurkar/longformer-base-4096-finetuned-fake-news')

class NewsAnalyzer:
    def __init__(self):
        self.credible_domains = {
            'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'bloomberg.com',
            'nytimes.com', 'wsj.com', 'washingtonpost.com', 'economist.com'
        }
        self.vectorizer = TfidfVectorizer(stop_words='english')
        
    async def analyze_news(self, content: str, is_url: bool) -> Dict:
        """
        Analyze news content for reliability.
        
        Args:
            content: The news content or URL to analyze
            is_url: Boolean indicating if the content is a URL
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Extract text if URL
            if is_url:
                text, metadata = self._extract_from_url(content)
            else:
                text = content
                metadata = {}
            
            # Perform various analyses
            sentiment_score = self._analyze_sentiment(text)
            clickbait_score = self._detect_clickbait(text)
            bias_score = self._analyze_bias(text)
            fact_score = self._analyze_factual_language(text)
            source_score = self._evaluate_source(content) if is_url else 0.5
            
            # Get fake news probability from model
            fake_news_score = self._classify_fake_news(text)
            
            # Calculate final reliability score
            reliability_score = self._calculate_reliability(
                sentiment=sentiment_score,
                clickbait=clickbait_score,
                bias=bias_score,
                factual=fact_score,
                source=source_score,
                fake_news=fake_news_score
            )
            
            # Calculate confidence based on various factors
            confidence = self._calculate_confidence(text, metadata)
            
            return {
                'result': 'reliable' if reliability_score >= 0.6 else 'unreliable',
                'confidence': round(confidence * 100, 2),
                'details': {
                    'reliability_score': round(reliability_score * 100, 2),
                    'sentiment_score': round(sentiment_score * 100, 2),
                    'clickbait_score': round(clickbait_score * 100, 2),
                    'bias_score': round(bias_score * 100, 2),
                    'factual_score': round(fact_score * 100, 2),
                    'source_score': round(source_score * 100, 2),
                    'fake_news_probability': round(fake_news_score * 100, 2)
                }
            }
            
        except Exception as e:
            logging.error(f"Error analyzing news: {str(e)}")
            return {
                'result': 'error',
                'confidence': 0,
                'error': str(e)
            }

    def _extract_from_url(self, url: str) -> Tuple[str, Dict]:
        """Extract text and metadata from URL using newspaper3k"""
        article = Article(url)
        article.download()
        article.parse()
        article.nlp()
        
        return article.text, {
            'title': article.title,
            'authors': article.authors,
            'publish_date': article.publish_date,
            'keywords': article.keywords,
            'summary': article.summary
        }

    def _analyze_sentiment(self, text: str) -> float:
        """Analyze text sentiment. Returns score between 0 and 1."""
        result = sentiment_analyzer(text[:512])[0]  # Limit text length for transformer
        return float(result['score'] if result['label'] == 'POSITIVE' else 1 - result['score'])

    def _detect_clickbait(self, text: str) -> float:
        """Detect clickbait characteristics. Returns score between 0 (clickbait) and 1."""
        clickbait_patterns = [
            r'(?i)you won\'t believe',
            r'(?i)shocking',
            r'(?i)mind(-|\s)?blowing',
            r'(?i)this is why',
            r'\d+\s+(?:ways|things|reasons|facts)',
            r'(?i)must see',
            r'(?i)what happens next'
        ]
        
        pattern_matches = sum(1 for pattern in clickbait_patterns if re.search(pattern, text))
        return 1 - (pattern_matches / len(clickbait_patterns))

    def _analyze_bias(self, text: str) -> float:
        """Analyze text for bias indicators. Returns score between 0 (biased) and 1."""
        doc = nlp(text)
        
        # Check for emotional language
        emotional_words = sum(1 for token in doc if token.pos_ == 'ADJ' or token.pos_ == 'ADV')
        emotional_ratio = emotional_words / len(doc)
        
        # Check for personal pronouns (indicating subjective content)
        personal_pronouns = sum(1 for token in doc if token.pos_ == 'PRON')
        pronoun_ratio = personal_pronouns / len(doc)
        
        return 1 - ((emotional_ratio + pronoun_ratio) / 2)

    def _analyze_factual_language(self, text: str) -> float:
        """Analyze text for factual language. Returns score between 0 and 1."""
        doc = nlp(text)
        
        # Count named entities (indicating specific facts)
        named_entities = len(doc.ents)
        
        # Count numbers and dates (indicating specific facts)
        numbers = sum(1 for token in doc if token.like_num or token.ent_type_ in ['DATE', 'TIME'])
        
        # Calculate ratio of factual elements to text length
        factual_ratio = (named_entities + numbers) / len(doc)
        
        return min(factual_ratio, 1.0)

    def _evaluate_source(self, url: str) -> float:
        """Evaluate credibility of the source domain. Returns score between 0 and 1."""
        domain = urlparse(url).netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
            
        # Check if domain is in credible sources
        if domain in self.credible_domains:
            return 1.0
            
        # Add additional source evaluation logic here
        # For now, return a moderate score for unknown sources
        return 0.5

    def _classify_fake_news(self, text: str) -> float:
        """Classify text as fake news. Returns probability between 0 and 1."""
        result = fake_news_classifier(text[:4096])[0]  # Limit text length for transformer
        return float(result['score'] if result['label'] == 'FAKE' else 1 - result['score'])

    def _calculate_reliability(self, **scores) -> float:
        """Calculate final reliability score using weighted average of all scores."""
        weights = {
            'sentiment': 0.1,
            'clickbait': 0.15,
            'bias': 0.2,
            'factual': 0.25,
            'source': 0.15,
            'fake_news': 0.15
        }
        
        return sum(score * weights[metric] for metric, score in scores.items())

    def _calculate_confidence(self, text: str, metadata: Dict) -> float:
        """Calculate confidence in the analysis."""
        factors = []
        
        # Text length factor
        text_length = len(text)
        factors.append(min(text_length / 1000, 1.0))  # Cap at 1000 characters
        
        # Metadata completeness
        if metadata:
            metadata_completeness = sum(1 for v in metadata.values() if v) / len(metadata)
            factors.append(metadata_completeness)
        
        # Language complexity
        doc = nlp(text[:1000])  # Limit for performance
        sentence_lengths = [len(sent) for sent in doc.sents]
        if sentence_lengths:
            avg_sentence_length = sum(sentence_lengths) / len(sentence_lengths)
            complexity_score = min(avg_sentence_length / 20, 1.0)  # Cap at 20 words
            factors.append(complexity_score)
        
        return sum(factors) / len(factors) 