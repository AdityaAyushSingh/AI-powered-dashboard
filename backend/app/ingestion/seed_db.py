from __future__ import annotations
"""
Seed script: generates realistic CSV files and populates the SQLite database.
Run once at startup via `python -m app.ingestion.seed_db`.
"""
import os
import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy.orm import Session

from app.db.database import Base, engine, init_db, SessionLocal
from app.db.models import Movie, Viewer, WatchActivity, Review, MarketingSpend, RegionalPerformance
from app.config import get_settings

settings = get_settings()
CSV_DIR = Path(settings.csv_data_dir)
CSV_DIR.mkdir(parents=True, exist_ok=True)

random.seed(42)

# ── Master data ──────────────────────────────────────────────────────────────

MOVIES = [
    {"id": 1,  "title": "Stellar Run",      "genre": "Action",       "release_year": 2025, "runtime_minutes": 128, "director": "Maya Chen",      "description": "An elite astronaut races to prevent a solar catastrophe in this high-octane sci-action thriller."},
    {"id": 2,  "title": "Dark Orbit",       "genre": "Sci-Fi",       "release_year": 2025, "runtime_minutes": 142, "director": "James Holloway", "description": "A deep-space mining crew uncovers alien technology with dangerous consequences."},
    {"id": 3,  "title": "Last Kingdom",     "genre": "Drama",        "release_year": 2025, "runtime_minutes": 156, "director": "Priya Nair",     "description": "A sweeping historical epic about the fall of an ancient empire."},
    {"id": 4,  "title": "Neon Pulse",       "genre": "Thriller",     "release_year": 2025, "runtime_minutes": 112, "director": "Leo Vasquez",    "description": "A cyber-noir thriller set in a near-future city where memories can be hacked."},
    {"id": 5,  "title": "Ocean Blue",       "genre": "Documentary",  "release_year": 2025, "runtime_minutes": 94,  "director": "Sofia Eriksson", "description": "A breathtaking exploration of deep-ocean ecosystems under threat."},
    {"id": 6,  "title": "Silver Screen",    "genre": "Comedy",       "release_year": 2025, "runtime_minutes": 100, "director": "Tom Briggs",     "description": "A nostalgic comedy about a failing small-town movie theater."},
    {"id": 7,  "title": "The Long Game",    "genre": "Sports",       "release_year": 2025, "runtime_minutes": 130, "director": "Ravi Sharma",    "description": "An underdog cricket team battles corruption to reach the World Cup."},
    {"id": 8,  "title": "Wild Hearts",      "genre": "Romance",      "release_year": 2025, "runtime_minutes": 108, "director": "Amara Diallo",   "description": "Two rival conservationists fall in love while protecting an endangered species."},
    {"id": 9,  "title": "Code Red",         "genre": "Action",       "release_year": 2025, "runtime_minutes": 118, "director": "Sam Park",       "description": "A cybersecurity expert goes rogue to stop a global ransomware attack."},
    {"id": 10, "title": "The Forgotten Path","genre": "Drama",        "release_year": 2024, "runtime_minutes": 144, "director": "Isla Morrison",  "description": "Three strangers connected by a single letter across three decades."},
    {"id": 11, "title": "Quantum Shift",    "genre": "Sci-Fi",       "release_year": 2025, "runtime_minutes": 138, "director": "Chen Wei",       "description": "A physicist discovers parallel universes but can only visit them once."},
    {"id": 12, "title": "Laugh Track",      "genre": "Comedy",       "release_year": 2024, "runtime_minutes": 98,  "director": "Nina Foster",    "description": "A sitcom writer navigates the absurd world of network television."},
    {"id": 13, "title": "Rising Tide",      "genre": "Documentary",  "release_year": 2025, "runtime_minutes": 88,  "director": "Marco Reyes",    "description": "The story of coastal communities adapting to rising sea levels."},
    {"id": 14, "title": "Night Watch",      "genre": "Thriller",     "release_year": 2024, "runtime_minutes": 120, "director": "Yuki Tanaka",    "description": "A night security guard at a museum suspects a heist is being planned."},
    {"id": 15, "title": "Summit",           "genre": "Sports",       "release_year": 2025, "runtime_minutes": 115, "director": "Erik Johansson", "description": "The dramatic story of the first team to summit an unmapped Himalayan peak."},
]

AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"]
REGIONS = ["North", "South", "East", "West", "Central"]
CITIES = {
    "North":   ["Delhi", "Chandigarh", "Jaipur"],
    "South":   ["Bangalore", "Chennai", "Hyderabad"],
    "East":    ["Kolkata", "Bhubaneswar", "Patna"],
    "West":    ["Mumbai", "Pune", "Ahmedabad"],
    "Central": ["Bhopal", "Nagpur", "Indore"],
}
GENDERS = ["Male", "Female", "Non-binary"]
TIERS = ["Free", "Basic", "Premium", "Enterprise"]
DEVICES = ["Mobile", "TV", "Tablet", "Desktop"]
CHANNELS = ["Social Media", "Search", "Display", "Email", "Influencer", "OTT Native"]
SENTIMENTS = ["positive", "neutral", "negative"]

# View weight: Stellar Run trending strongly in recent months
VIEW_WEIGHTS = {
    1:  2.4,  # Stellar Run — high/trending
    2:  1.9,  # Dark Orbit — strong
    3:  1.7,  # Last Kingdom — strong
    4:  1.4,  # Neon Pulse
    5:  1.1,  # Ocean Blue
    6:  0.6,  # Silver Screen — weak (comedy)
    7:  1.3,  # The Long Game
    8:  1.0,  # Wild Hearts
    9:  1.6,  # Code Red
    10: 1.2,  # The Forgotten Path
    11: 1.5,  # Quantum Shift
    12: 0.5,  # Laugh Track — weak (comedy)
    13: 0.9,  # Rising Tide
    14: 1.1,  # Night Watch
    15: 1.2,  # Summit
}

# Rating weights per movie (comedy lower)
RATING_BASES = {
    1: 4.4, 2: 4.2, 3: 4.5, 4: 4.0, 5: 4.3,
    6: 3.2, 7: 4.1, 8: 3.9, 9: 4.0, 10: 4.4,
    11: 4.3, 12: 3.0, 13: 4.2, 14: 3.8, 15: 4.1,
}


def _random_date(start: datetime, end: datetime) -> datetime:
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))


def generate_viewers(n: int = 300) -> list[dict]:
    viewers = []
    for i in range(1, n + 1):
        region = random.choice(REGIONS)
        city = random.choice(CITIES[region])
        viewers.append({
            "id": i,
            "age_group": random.choice(AGE_GROUPS),
            "region": region,
            "city": city,
            "gender": random.choice(GENDERS),
            "subscription_tier": random.choices(TIERS, weights=[20, 35, 35, 10])[0],
        })
    return viewers


def generate_watch_activity(viewers: list[dict], n: int = 6000) -> list[dict]:
    activities = []
    jan2025 = datetime(2025, 1, 1)
    apr2025 = datetime(2025, 4, 30, 23, 59)
    # Recent spike window for Stellar Run (Feb-Apr 2025)
    recent_start = datetime(2025, 2, 1)

    movie_ids = [m["id"] for m in MOVIES]
    weights = [VIEW_WEIGHTS[mid] for mid in movie_ids]

    for i in range(1, n + 1):
        movie_id = random.choices(movie_ids, weights=weights)[0]

        # Stellar Run gets extra weight in recent months
        if movie_id == 1:
            watched_at = _random_date(recent_start, apr2025)
        else:
            watched_at = _random_date(jan2025, apr2025)

        movie = next(m for m in MOVIES if m["id"] == movie_id)
        max_dur = movie["runtime_minutes"]
        watch_dur = random.randint(10, max_dur)
        completed = watch_dur >= int(max_dur * 0.85)

        activities.append({
            "id": i,
            "viewer_id": random.randint(1, len(viewers)),
            "movie_id": movie_id,
            "watched_at": watched_at.isoformat(),
            "watch_duration_minutes": watch_dur,
            "completed": completed,
            "device": random.choice(DEVICES),
        })
    return activities


def generate_reviews(viewers: list[dict], n: int = 800) -> list[dict]:
    reviews = []
    jan2025 = datetime(2025, 1, 1)
    apr2025 = datetime(2025, 4, 30)

    for i in range(1, n + 1):
        movie_id = random.randint(1, len(MOVIES))
        base = RATING_BASES[movie_id]
        rating = round(min(5.0, max(1.0, random.gauss(base, 0.4))), 1)
        sentiment = "positive" if rating >= 4.0 else ("neutral" if rating >= 3.0 else "negative")

        reviews.append({
            "id": i,
            "movie_id": movie_id,
            "viewer_id": random.randint(1, len(viewers)),
            "rating": rating,
            "sentiment": sentiment,
            "review_text": "",  # skipped for brevity
            "created_at": _random_date(jan2025, apr2025).isoformat(),
        })
    return reviews


def generate_marketing_spend() -> list[dict]:
    spends = []
    idx = 1
    for movie in MOVIES:
        movie_id = movie["id"]
        for channel in random.sample(CHANNELS, k=random.randint(2, 4)):
            region = random.choice(REGIONS)
            base_spend = random.uniform(50_000, 500_000)
            # Comedy gets less spend
            if movie["genre"] == "Comedy":
                base_spend *= 0.4
            start = datetime(2025, random.randint(1, 3), random.randint(1, 15))
            end = start + timedelta(days=random.randint(14, 60))
            impressions = int(base_spend * random.uniform(5, 15))
            clicks = int(impressions * random.uniform(0.02, 0.08))
            spends.append({
                "id": idx,
                "movie_id": movie_id,
                "channel": channel,
                "spend_amount": round(base_spend, 2),
                "campaign_start": start.date().isoformat(),
                "campaign_end": end.date().isoformat(),
                "region": region,
                "impressions": impressions,
                "clicks": clicks,
            })
            idx += 1
    return spends


def generate_regional_performance(activities: list[dict], viewers: list[dict]) -> list[dict]:
    """Aggregate watch activities into monthly regional performance rows."""
    from collections import defaultdict

    # viewer_id → city/region lookup
    viewer_map = {v["id"]: (v["region"], v["city"]) for v in viewers}
    # movie_id → revenue per view (rough proxy)
    revenue_per_view = {m["id"]: random.uniform(1.5, 4.5) for m in MOVIES}

    buckets: dict[tuple, list] = defaultdict(list)
    for act in activities:
        dt = datetime.fromisoformat(act["watched_at"])
        if dt.year != 2025:
            continue
        viewer_id = act["viewer_id"]
        region, city = viewer_map.get(viewer_id, ("Unknown", "Unknown"))
        key = (act["movie_id"], region, city, dt.month, dt.year)
        buckets[key].append(act)

    rows = []
    idx = 1
    for (movie_id, region, city, month, year), acts in buckets.items():
        views = len(acts)
        revenue = round(views * revenue_per_view[movie_id], 2)
        rows.append({
            "id": idx,
            "movie_id": movie_id,
            "region": region,
            "city": city,
            "views": views,
            "revenue": revenue,
            "month": month,
            "year": year,
        })
        idx += 1
    return rows


def write_csv(filename: str, rows: list[dict]) -> None:
    if not rows:
        return
    path = CSV_DIR / f"{filename}.csv"
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


def seed(force: bool = False) -> None:
    from app.utils.logger import get_logger
    log = get_logger("seed_db")
    random.seed(42)

    db_path = Path(settings.database_url.replace("sqlite:///", ""))
    if db_path.exists() and not force:
        log.info("Database already exists, skipping seed", path=str(db_path))
        return

    log.info("Initialising database schema")
    if force:
        from app.db import models  # noqa: F401 — registers models
        Base.metadata.drop_all(bind=engine)
    init_db()

    log.info("Generating seed data")
    viewers_data = generate_viewers(300)
    activities_data = generate_watch_activity(viewers_data, 6000)
    reviews_data = generate_reviews(viewers_data, 800)
    marketing_data = generate_marketing_spend()
    regional_data = generate_regional_performance(activities_data, viewers_data)

    log.info("Writing CSV files")
    write_csv("movies", MOVIES)
    write_csv("viewers", viewers_data)
    write_csv("watch_activity", activities_data)
    write_csv("reviews", reviews_data)
    write_csv("marketing_spend", marketing_data)
    write_csv("regional_performance", regional_data)

    log.info("Loading data into database")
    db: Session = SessionLocal()
    try:
        # Movies
        for m in MOVIES:
            db.add(Movie(**{k: v for k, v in m.items() if k != "avg_rating" and k != "total_views"}))
        db.flush()

        # Viewers
        for v in viewers_data:
            db.add(Viewer(**v))
        db.flush()

        # Watch activities
        for a in activities_data:
            a_copy = dict(a)
            a_copy["watched_at"] = datetime.fromisoformat(a_copy["watched_at"])
            a_copy["completed"] = bool(a_copy["completed"])
            db.add(WatchActivity(**a_copy))
        db.flush()

        # Reviews
        for r in reviews_data:
            r_copy = dict(r)
            r_copy["created_at"] = datetime.fromisoformat(r_copy["created_at"])
            del r_copy["review_text"]  # skip empty field
            db.add(Review(**r_copy))
        db.flush()

        # Marketing spend
        for s in marketing_data:
            s_copy = dict(s)
            s_copy["campaign_start"] = datetime.fromisoformat(s_copy["campaign_start"])
            s_copy["campaign_end"] = datetime.fromisoformat(s_copy["campaign_end"])
            db.add(MarketingSpend(**s_copy))
        db.flush()

        # Regional performance
        for rp in regional_data:
            db.add(RegionalPerformance(**rp))

        db.commit()
        log.info("Seed complete",
                 movies=len(MOVIES),
                 viewers=len(viewers_data),
                 activities=len(activities_data),
                 reviews=len(reviews_data),
                 marketing=len(marketing_data),
                 regional=len(regional_data))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed(force=True)
