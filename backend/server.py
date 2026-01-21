from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import aiohttp

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ========== GAME MODELS ==========
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    username: str = "Angler"
    unlocked_lures: List[int] = Field(default_factory=lambda: [0])
    high_score: int = 0
    total_catches: int = 0
    level: int = 1
    prestige: int = 0
    achievements: List[str] = Field(default_factory=list)
    daily_challenge_completed: bool = False
    daily_challenge_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    device_id: str
    username: Optional[str] = "Angler"

class Score(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    score: int
    level: int
    catches: int
    stage: int
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScoreCreate(BaseModel):
    user_id: str
    username: str
    score: int
    level: int
    catches: int
    stage: int

class LurePurchase(BaseModel):
    user_id: str
    lure_id: int

class AchievementUnlock(BaseModel):
    achievement_id: str

class Weather(BaseModel):
    condition: str
    temperature: int
    wind_speed: int
    cloud_cover: int
    precipitation: int
    cached_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ========== USER ROUTES ==========
@api_router.post("/user", response_model=dict)
async def create_or_get_user(input: UserCreate):
    """Create new user or return existing user by device_id"""
    existing = await db.users.find_one({"device_id": input.device_id}, {"_id": 0})
    if existing:
        return existing
    
    user = User(device_id=input.device_id, username=input.username)
    await db.users.insert_one(user.model_dump())
    return user.model_dump()

@api_router.get("/user/{device_id}", response_model=dict)
async def get_user(device_id: str):
    """Get user by device_id"""
    user = await db.users.find_one({"device_id": device_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.post("/user/{user_id}/unlock-lure")
async def unlock_lure(user_id: str, purchase: LurePurchase):
    """Unlock a lure for user"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    unlocked = user.get("unlocked_lures", [0])
    if purchase.lure_id not in unlocked:
        unlocked.append(purchase.lure_id)
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"unlocked_lures": unlocked}}
        )
    
    return {"success": True, "unlocked_lures": unlocked}

@api_router.post("/user/{user_id}/update-high-score")
async def update_high_score(user_id: str, score: int):
    """Update user's high score"""
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"high_score": score}}
    )
    return {"success": True}

@api_router.post("/user/{user_id}/increment-catches")
async def increment_catches(user_id: str, count: int = 1):
    """Increment total catches"""
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"total_catches": count}}
    )
    return {"success": True}

@api_router.post("/user/{user_id}/set-level")
async def set_level(user_id: str, level: int):
    """Set user level"""
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"level": level}}
    )
    return {"success": True}

@api_router.post("/user/{user_id}/prestige")
async def prestige_user(user_id: str):
    """Prestige user - reset to level 1 with bonus"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_prestige = user.get("prestige", 0) + 1
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"prestige": new_prestige, "level": 1}}
    )
    return {"success": True, "prestige": new_prestige}

@api_router.post("/user/{user_id}/unlock-achievement")
async def unlock_achievement(user_id: str, achievement: AchievementUnlock):
    """Unlock an achievement"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    achievements = user.get("achievements", [])
    if achievement.achievement_id not in achievements:
        achievements.append(achievement.achievement_id)
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"achievements": achievements}}
        )
    return {"success": True, "achievements": achievements}

@api_router.post("/user/{user_id}/complete-daily")
async def complete_daily(user_id: str):
    """Mark daily challenge as complete"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"daily_challenge_completed": True, "daily_challenge_date": today}}
    )
    return {"success": True}


# ========== SCORE ROUTES ==========
@api_router.post("/score", response_model=dict)
async def create_score(input: ScoreCreate):
    """Submit a new score"""
    score = Score(**input.model_dump())
    await db.scores.insert_one(score.model_dump())
    
    # Update user high score if needed
    user = await db.users.find_one({"id": input.user_id}, {"_id": 0})
    if user and input.score > user.get("high_score", 0):
        await db.users.update_one(
            {"id": input.user_id},
            {"$set": {"high_score": input.score}}
        )
    
    return score.model_dump()

@api_router.get("/leaderboard", response_model=List[dict])
async def get_leaderboard(limit: int = 100):
    """Get top scores (global leaderboard)"""
    scores = await db.scores.find({}, {"_id": 0}).sort("score", -1).limit(limit).to_list(limit)
    return [
        {
            "username": s["username"],
            "score": s["score"],
            "level": s["level"],
            "catches": s["catches"],
            "timestamp": s["timestamp"]
        }
        for s in scores
    ]


# ========== WEATHER ROUTES ==========
@api_router.get("/weather")
async def get_weather():
    """Get current weather (cached for 30 min)"""
    cached = await db.weather.find_one({}, {'_id': 0})
    if cached:
        cached_time = datetime.fromisoformat(cached.get("cached_at", "2000-01-01T00:00:00+00:00"))
        if datetime.now(timezone.utc) - cached_time < timedelta(minutes=30):
            return {
                "condition": cached["condition"],
                "temperature": cached["temperature"],
                "wind_speed": cached["wind_speed"],
                "cloud_cover": cached["cloud_cover"],
                "precipitation": cached["precipitation"]
            }
    
    try:
        async with aiohttp.ClientSession() as session:
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": 52.52,
                "longitude": 13.41,
                "current_weather": "true",
                "hourly": "precipitation_probability,cloud_cover"
            }
            async with session.get(url, params=params) as response:
                data = await response.json()
                
                cw = data.get("current_weather", {})
                weather_code = cw.get("weathercode", 0)
                
                if weather_code < 4:
                    condition = "clear"
                elif weather_code < 50:
                    condition = "cloudy"
                elif weather_code < 70:
                    condition = "rain"
                else:
                    condition = "storm"
                
                weather_data = {
                    "condition": condition,
                    "temperature": int(cw.get("temperature", 18)),
                    "wind_speed": int(cw.get("windspeed", 8)),
                    "cloud_cover": data.get("hourly", {}).get("cloud_cover", [30])[0],
                    "precipitation": data.get("hourly", {}).get("precipitation_probability", [0])[0],
                    "cached_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.weather.delete_many({})
                await db.weather.insert_one(weather_data)
                
                return {k: v for k, v in weather_data.items() if k != "cached_at"}
    except Exception as e:
        logging.error(f"Weather API error: {e}")
        return {
            "condition": "clear",
            "temperature": 18,
            "wind_speed": 8,
            "cloud_cover": 30,
            "precipitation": 0
        }


# ========== TACKLEBOX ROUTES ==========
@api_router.post("/tacklebox/{user_id}/add-fish")
async def add_fish_to_tacklebox(user_id: str, fish: dict):
    """Add caught fish to tacklebox"""
    fish_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": fish.get("name"),
        "size": fish.get("size"),
        "points": fish.get("points"),
        "color": fish.get("color"),
        "caught_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tacklebox.insert_one(fish_doc)
    return {"success": True, "fish_id": fish_doc["id"]}

@api_router.get("/tacklebox/{user_id}")
async def get_tacklebox(user_id: str, limit: int = 1000):
    """Get user's tacklebox (last 1000 fish for performance)"""
    fish = await db.tacklebox.find(
        {"user_id": user_id}, 
        {"_id": 0}
    ).sort("caught_at", -1).limit(limit).to_list(limit)
    return {"fish": fish, "count": len(fish)}


# ========== DAILY CHALLENGE ==========
@api_router.get("/daily-challenge")
async def get_daily_challenge():
    """Get today's daily challenge"""
    today = datetime.now(timezone.utc)
    seed = today.year * 10000 + today.month * 100 + today.day
    
    challenges = [
        {"type": "catch_count", "target": 50, "description": "Catch 50 fish today", "reward": 500},
        {"type": "catch_legendary", "target": 1, "description": "Catch a Golden Koi", "reward": 1000},
        {"type": "level_up", "target": 5, "description": "Level up 5 times", "reward": 750},
        {"type": "score", "target": 5000, "description": "Score 5000 points", "reward": 600},
        {"type": "perfect_catches", "target": 10, "description": "Get 10 perfect catches", "reward": 800},
    ]
    
    challenge = challenges[seed % len(challenges)]
    challenge["date"] = today.strftime("%Y-%m-%d")
    return challenge


# ========== ACHIEVEMENTS ==========
ACHIEVEMENTS = [
    {"id": "first_catch", "name": "First Catch", "description": "Catch your first fish", "icon": "🐟"},
    {"id": "catch_100", "name": "Century Fisher", "description": "Catch 100 fish", "icon": "💯"},
    {"id": "catch_1000", "name": "Master Angler", "description": "Catch 1000 fish", "icon": "🏆"},
    {"id": "golden_koi", "name": "Legendary Hunter", "description": "Catch a Golden Koi", "icon": "⭐"},
    {"id": "level_10", "name": "Rising Star", "description": "Reach level 10", "icon": "🌟"},
    {"id": "level_50", "name": "Pro Angler", "description": "Reach level 50", "icon": "🎖️"},
    {"id": "level_100", "name": "Fishing Legend", "description": "Reach level 100", "icon": "👑"},
    {"id": "prestige_1", "name": "Reborn", "description": "Prestige for the first time", "icon": "♻️"},
    {"id": "all_lures", "name": "Collector", "description": "Unlock all lures", "icon": "🎣"},
    {"id": "perfect_10", "name": "Perfectionist", "description": "Get 10 perfect catches in a row", "icon": "✨"},
    {"id": "whale_watcher", "name": "Whale Watcher", "description": "See the whale 10 times", "icon": "🐋"},
    {"id": "storm_fisher", "name": "Storm Chaser", "description": "Catch 50 fish during storms", "icon": "⛈️"},
]

@api_router.get("/achievements")
async def get_achievements():
    """Get all available achievements"""
    return {"achievements": ACHIEVEMENTS}


# ========== LEGACY ROUTES ==========
@api_router.get("/")
async def root():
    return {"message": "GO FISH! - Fishing Master 2025 API"}

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StatusCheckCreate(BaseModel):
    client_name: str

@api_router.post("/status", response_model=dict)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj.model_dump()

@api_router.get("/status", response_model=List[dict])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    return status_checks


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
