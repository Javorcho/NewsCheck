import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urlparse
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from typing import Dict, List, Any
import json

class NewsVerifier:
    def __init__(self):
        # Download required NLTK data
        try:
            nltk.data.find('vader_lexicon')
        except LookupError:
            nltk.download('vader_lexicon')
        
        self.sia = SentimentIntensityAnalyzer()
        
        # Load known fake news domains (this would typically come from a database)
        self.known_fake_domains = set([
            # Add known fake news domains here
        ])
        
        # Load known reliable news domains
        self.known_reliable_domains = set([
            'reuters.com',
            'apnews.com',
            'bbc.com',
            'nytimes.com',
            'washingtonpost.com',
            'theguardian.com',
            # Add more reliable sources
        ])

    def verify(self, url: str) -> Dict[str, Any]:
        """
        Verify a news article URL and return analysis results
        """
        try:
            # Fetch and parse the article
            article_data = self._fetch_article(url)
            if not article_data:
                raise Exception("Could not fetch article content")

            # Perform various checks
            domain_check = self._check_domain(url)
            content_check = self._analyze_content(article_data)
            sentiment_check = self._analyze_sentiment(article_data['text'])
            
            # Combine results
            is_fake = self._determine_if_fake(domain_check, content_check, sentiment_check)
            confidence = self._calculate_confidence(domain_check, content_check, sentiment_check)
            reasons = self._generate_reasons(domain_check, content_check, sentiment_check)
            
            return {
                'is_fake': is_fake,
                'confidence': confidence,
                'reasons': reasons
            }
            
        except Exception as e:
            raise Exception(f"Error verifying article: {str(e)}")

    def _fetch_article(self, url: str) -> Dict[str, str]:
        """
        Fetch and parse article content
        """
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title
        title = soup.find('title')
        title_text = title.text if title else ''
        
        # Extract main content (this is a simple implementation)
        # In a production environment, you'd want to use a more sophisticated content extraction
        content = soup.find('article') or soup.find('main') or soup.find('div', class_=re.compile('content|article|post'))
        content_text = content.get_text() if content else ''
        
        return {
            'title': title_text,
            'text': content_text
        }

    def _check_domain(self, url: str) -> Dict[str, Any]:
        """
        Check if the domain is known to be reliable or fake
        """
        domain = urlparse(url).netloc.lower()
        
        if domain in self.known_fake_domains:
            return {
                'score': 0,
                'reason': 'Domain is known for spreading fake news'
            }
        elif domain in self.known_reliable_domains:
            return {
                'score': 1,
                'reason': 'Domain is from a reliable news source'
            }
        else:
            return {
                'score': 0.5,
                'reason': 'Domain is not in our known sources database'
            }

    def _analyze_content(self, article_data: Dict[str, str]) -> Dict[str, Any]:
        """
        Analyze article content for fake news indicators
        """
        title = article_data['title']
        text = article_data['text']
        
        # Check for clickbait patterns in title
        clickbait_patterns = [
            r'you won\'t believe',
            r'shocking',
            r'mind-blowing',
            r'never seen before',
            r'will surprise you',
            r'went viral',
            r'went crazy',
            r'everyone is talking about'
        ]
        
        clickbait_score = 0
        for pattern in clickbait_patterns:
            if re.search(pattern, title.lower()):
                clickbait_score += 1
        
        # Check for excessive punctuation
        excessive_punctuation = len(re.findall(r'[!?]{2,}', title)) > 0
        
        # Check for all caps
        all_caps = title.isupper()
        
        # Calculate content score
        content_score = 1.0
        reasons = []
        
        if clickbait_score > 0:
            content_score -= 0.2 * clickbait_score
            reasons.append('Title contains clickbait patterns')
        
        if excessive_punctuation:
            content_score -= 0.1
            reasons.append('Title contains excessive punctuation')
        
        if all_caps:
            content_score -= 0.1
            reasons.append('Title is in all caps')
        
        return {
            'score': max(0, content_score),
            'reasons': reasons
        }

    def _analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze the sentiment of the article
        """
        sentiment = self.sia.polarity_scores(text)
        
        # Extreme sentiment can be an indicator of bias
        compound_score = abs(sentiment['compound'])
        
        if compound_score > 0.8:
            return {
                'score': 0.5,
                'reason': 'Article shows extreme sentiment bias'
            }
        elif compound_score > 0.5:
            return {
                'score': 0.7,
                'reason': 'Article shows moderate sentiment bias'
            }
        else:
            return {
                'score': 1.0,
                'reason': 'Article shows balanced sentiment'
            }

    def _determine_if_fake(self, domain_check: Dict[str, Any], 
                         content_check: Dict[str, Any], 
                         sentiment_check: Dict[str, Any]) -> bool:
        """
        Determine if the article is likely fake based on all checks
        """
        # Weight the different checks
        domain_weight = 0.4
        content_weight = 0.4
        sentiment_weight = 0.2
        
        total_score = (
            domain_check['score'] * domain_weight +
            content_check['score'] * content_weight +
            sentiment_check['score'] * sentiment_weight
        )
        
        return total_score < 0.6

    def _calculate_confidence(self, domain_check: Dict[str, Any],
                            content_check: Dict[str, Any],
                            sentiment_check: Dict[str, Any]) -> float:
        """
        Calculate confidence score for the verification
        """
        # Weight the different checks
        domain_weight = 0.4
        content_weight = 0.4
        sentiment_weight = 0.2
        
        total_score = (
            domain_check['score'] * domain_weight +
            content_check['score'] * content_weight +
            sentiment_check['score'] * sentiment_weight
        )
        
        return round(total_score * 100, 2)

    def _generate_reasons(self, domain_check: Dict[str, Any],
                         content_check: Dict[str, Any],
                         sentiment_check: Dict[str, Any]) -> List[str]:
        """
        Generate a list of reasons for the verification result
        """
        reasons = []
        
        if domain_check['score'] < 1:
            reasons.append(domain_check['reason'])
        
        reasons.extend(content_check['reasons'])
        
        if sentiment_check['score'] < 1:
            reasons.append(sentiment_check['reason'])
        
        return reasons 