from __future__ import annotations
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    genre = Column(String(50), nullable=False, index=True)
    release_year = Column(Integer, nullable=False)
    runtime_minutes = Column(Integer)
    director = Column(String(200))
    description = Column(Text)
    avg_rating = Column(Float, default=0.0)
    total_views = Column(Integer, default=0)

    watch_activities = relationship("WatchActivity", back_populates="movie")
    reviews = relationship("Review", back_populates="movie")
    marketing_spends = relationship("MarketingSpend", back_populates="movie")
    regional_performances = relationship("RegionalPerformance", back_populates="movie")


class Viewer(Base):
    __tablename__ = "viewers"

    id = Column(Integer, primary_key=True, index=True)
    age_group = Column(String(20), nullable=False)
    region = Column(String(50), nullable=False)
    city = Column(String(100), nullable=False)
    gender = Column(String(20))
    subscription_tier = Column(String(20), nullable=False)

    watch_activities = relationship("WatchActivity", back_populates="viewer")
    reviews = relationship("Review", back_populates="viewer")


class WatchActivity(Base):
    __tablename__ = "watch_activity"

    id = Column(Integer, primary_key=True, index=True)
    viewer_id = Column(Integer, ForeignKey("viewers.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    watched_at = Column(DateTime, nullable=False, index=True)
    watch_duration_minutes = Column(Integer)
    completed = Column(Boolean, default=False)
    device = Column(String(30))

    viewer = relationship("Viewer", back_populates="watch_activities")
    movie = relationship("Movie", back_populates="watch_activities")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    viewer_id = Column(Integer, ForeignKey("viewers.id"), nullable=False)
    rating = Column(Float, nullable=False)
    sentiment = Column(String(20))
    review_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    movie = relationship("Movie", back_populates="reviews")
    viewer = relationship("Viewer", back_populates="reviews")


class MarketingSpend(Base):
    __tablename__ = "marketing_spend"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    channel = Column(String(50), nullable=False)
    spend_amount = Column(Float, nullable=False)
    campaign_start = Column(DateTime, nullable=False)
    campaign_end = Column(DateTime, nullable=False)
    region = Column(String(50))
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)

    movie = relationship("Movie", back_populates="marketing_spends")


class RegionalPerformance(Base):
    __tablename__ = "regional_performance"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    region = Column(String(50), nullable=False)
    city = Column(String(100), nullable=False)
    views = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    movie = relationship("Movie", back_populates="regional_performances")
