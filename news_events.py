"""
News Events Module

Generates random market news events that affect stock prices.
Different agent types see news at different times:
- Quants: Immediately (algorithmic news feeds)
- Fundamentals: 1 tick later (analyze before acting)
- Retail: 2 ticks later (sees it on social media)
"""

import random
from dataclasses import dataclass
from enum import Enum


class NewsType(Enum):
    EARNINGS_BEAT = "earnings_beat"
    EARNINGS_MISS = "earnings_miss"
    FDA_APPROVAL = "fda_approval"
    FDA_REJECTION = "fda_rejection"
    CEO_CHANGE = "ceo_change"
    MERGER = "merger_announcement"
    LAYOFFS = "layoffs"
    PRODUCT_LAUNCH = "product_launch"
    SCANDAL = "scandal"
    ANALYST_UPGRADE = "analyst_upgrade"
    ANALYST_DOWNGRADE = "analyst_downgrade"
    GUIDANCE_RAISE = "guidance_raise"
    GUIDANCE_CUT = "guidance_cut"


@dataclass
class NewsEvent:
    """A news event that affects a stock."""
    tick: int                    # When it happened
    stock: str                   # AAPL, MSFT, etc.
    news_type: NewsType
    headline: str                # Human readable headline
    sentiment: float             # -1.0 (very bad) to +1.0 (very good)
    magnitude: float             # How significant (0.0 to 1.0)
    
    # Visibility schedule - which tick each agent type can "see" the news
    quant_visible_tick: int      # tick + 0 (immediate, algo feeds)
    fundamental_visible_tick: int # tick + 1 (reads report first)
    retail_visible_tick: int     # tick + 2 (Twitter/Reddit delay)


# News headline templates
NEWS_TEMPLATES = {
    NewsType.EARNINGS_BEAT: [
        "🚀 {stock} CRUSHES Q4 earnings, EPS beats by {pct}%",
        "📈 {stock} reports blowout quarter, revenue up {pct}%",
        "💰 {stock} smashes expectations, guides higher",
    ],
    NewsType.EARNINGS_MISS: [
        "📉 {stock} MISSES earnings expectations by {pct}%",
        "💔 {stock} reports disappointing Q4, revenue down",
        "⚠️ {stock} warns of slowdown, misses estimates",
    ],
    NewsType.FDA_APPROVAL: [
        "✅ FDA APPROVES {stock}'s blockbuster drug",
        "🏥 {stock} gets FDA green light for new treatment",
    ],
    NewsType.FDA_REJECTION: [
        "❌ FDA REJECTS {stock}'s drug application",
        "🏥 {stock} faces FDA setback, drug delayed",
    ],
    NewsType.CEO_CHANGE: [
        "👔 {stock} CEO steps down, successor named",
        "🔄 Leadership shakeup at {stock}",
    ],
    NewsType.MERGER: [
        "🤝 {stock} announces major acquisition",
        "💼 {stock} in merger talks, deal imminent",
    ],
    NewsType.LAYOFFS: [
        "🔻 {stock} announces {pct}% workforce reduction",
        "📋 {stock} cuts jobs amid restructuring",
    ],
    NewsType.PRODUCT_LAUNCH: [
        "🎉 {stock} unveils revolutionary new product",
        "📱 {stock} launches next-gen product line",
    ],
    NewsType.SCANDAL: [
        "🚨 {stock} under investigation for fraud",
        "⚖️ {stock} faces major lawsuit, shares tumble",
    ],
    NewsType.ANALYST_UPGRADE: [
        "⬆️ Goldman upgrades {stock} to BUY, raises target",
        "📊 {stock} upgraded by major analyst, bull case strong",
    ],
    NewsType.ANALYST_DOWNGRADE: [
        "⬇️ {stock} DOWNGRADED to SELL by Goldman",
        "📊 Analyst slashes {stock} target, warns of headwinds",
    ],
    NewsType.GUIDANCE_RAISE: [
        "📈 {stock} RAISES full-year guidance",
        "💪 {stock} boosts outlook, demand strong",
    ],
    NewsType.GUIDANCE_CUT: [
        "📉 {stock} CUTS guidance, sees weakness ahead",
        "⚠️ {stock} lowers outlook amid challenges",
    ],
}

# Which news types are positive vs negative
POSITIVE_NEWS = {
    NewsType.EARNINGS_BEAT,
    NewsType.FDA_APPROVAL,
    NewsType.MERGER,
    NewsType.PRODUCT_LAUNCH,
    NewsType.ANALYST_UPGRADE,
    NewsType.GUIDANCE_RAISE,
}


class NewsGenerator:
    """Generates random news events during simulation."""
    
    def __init__(self, stocks: list[str], news_probability: float = 0.20):
        """
        Args:
            stocks: List of stock tickers that can have news
            news_probability: Chance of news each tick (0.20 = 20%)
        """
        self.stocks = stocks
        self.news_probability = news_probability
        self.active_news: list[NewsEvent] = []
    
    def maybe_generate_news(self, tick: int) -> NewsEvent | None:
        """Maybe generate a news event for this tick."""
        if random.random() > self.news_probability:
            return None
        
        # Pick random stock
        stock = random.choice(self.stocks)
        
        # Bias towards positive news (85% chance of good news)
        if random.random() < 0.85:
            # Pick from positive news types
            positive_types = list(POSITIVE_NEWS)
            news_type = random.choice(positive_types)
            is_positive = True
            sentiment = random.uniform(0.3, 1.0)
        else:
            # Pick from negative news types (15% chance)
            negative_types = [nt for nt in NewsType if nt not in POSITIVE_NEWS]
            news_type = random.choice(negative_types)
            is_positive = False
            sentiment = random.uniform(-1.0, -0.3)
        
        # Generate headline
        templates = NEWS_TEMPLATES.get(news_type, ["{stock} news event"])
        headline = random.choice(templates).format(
            stock=stock,
            pct=random.randint(5, 25)
        )
        
        # Create event with visibility schedule
        event = NewsEvent(
            tick=tick,
            stock=stock,
            news_type=news_type,
            headline=headline,
            sentiment=sentiment,
            magnitude=random.uniform(0.3, 1.0),
            quant_visible_tick=tick,          # Quants see immediately
            fundamental_visible_tick=tick + 1, # Fundamentals 1 tick later
            retail_visible_tick=tick + 2,      # Retail 2 ticks later
        )
        
        self.active_news.append(event)
        return event
    
    def get_visible_news(self, tick: int, agent_type: str) -> list[NewsEvent]:
        """Get news visible to this agent type at this tick.
        
        Args:
            tick: Current simulation tick
            agent_type: "quant", "fundamental", or "retail"
        """
        visible = []
        for news in self.active_news:
            if agent_type == "quant" and tick >= news.quant_visible_tick:
                visible.append(news)
            elif agent_type in ["fundamental", "institutional"] and tick >= news.fundamental_visible_tick:
                visible.append(news)
            elif agent_type in ["retail", "custom"] and tick >= news.retail_visible_tick:
                visible.append(news)
        
        # Return most recent 5
        return visible[-5:]
    
    def get_all_news(self) -> list[NewsEvent]:
        """Get all news events (for broadcasting to frontend)."""
        return self.active_news
    
    def clear_old_news(self, current_tick: int, max_age: int = 5):
        """Remove news older than max_age ticks."""
        self.active_news = [
            n for n in self.active_news 
            if current_tick - n.tick <= max_age
        ]
