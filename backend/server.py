from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'georesolve-secret-key-change-in-production')
ALGORITHM = "HS256"

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    phone: str
    password: str
    role: str = "citizen"  # citizen or admin
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    phone: str
    role: str
    name: str
    created_at: str

class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    latitude: float
    longitude: float
    images: Optional[List[str]] = []  # Base64 encoded images

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None

class Complaint(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    title: str
    description: str
    category: str
    status: str
    latitude: float
    longitude: float
    images: List[str]
    created_at: str
    updated_at: str
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    icon: str

# Auth Routes
@api_router.post("/auth/register")
async def register(user: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user.password)
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "phone": user.phone,
        "password": hashed_password,
        "role": user.role,
        "name": user.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "name": user.name
        }
    }

@api_router.post("/auth/login")
async def login(user: UserLogin):
    # Find user
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": db_user["id"], "role": db_user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "email": db_user["email"],
            "phone": db_user["phone"],
            "role": db_user["role"],
            "name": db_user["name"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "phone": current_user["phone"],
        "role": current_user["role"],
        "name": current_user["name"]
    }

# Complaint Routes
@api_router.post("/complaints", response_model=Complaint)
async def create_complaint(complaint: ComplaintCreate, current_user: dict = Depends(get_current_user)):
    complaint_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    complaint_doc = {
        "id": complaint_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "title": complaint.title,
        "description": complaint.description,
        "category": complaint.category,
        "status": "pending",
        "location": {
            "type": "Point",
            "coordinates": [complaint.longitude, complaint.latitude]
        },
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "images": complaint.images,
        "created_at": now,
        "updated_at": now,
        "assigned_to": None,
        "resolution_notes": None
    }
    
    await db.complaints.insert_one(complaint_doc)
    
    # Create geospatial index if not exists
    await db.complaints.create_index([("location", "2dsphere")])
    
    return Complaint(**{k: v for k, v in complaint_doc.items() if k != "location"})

@api_router.get("/complaints", response_model=List[Complaint])
async def get_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    complaints = await db.complaints.find(query, {"_id": 0, "location": 0}).to_list(1000)
    return complaints

@api_router.get("/complaints/nearby", response_model=List[Complaint])
async def get_nearby_complaints(
    latitude: float,
    longitude: float,
    radius: float = 5000,  # radius in meters
    current_user: dict = Depends(get_current_user)
):
    # Use MongoDB geospatial query
    query = {
        "location": {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "$maxDistance": radius
            }
        }
    }
    
    complaints = await db.complaints.find(query, {"_id": 0, "location": 0}).to_list(1000)
    return complaints

@api_router.get("/complaints/user/{user_id}", response_model=List[Complaint])
async def get_user_complaints(user_id: str, current_user: dict = Depends(get_current_user)):
    complaints = await db.complaints.find({"user_id": user_id}, {"_id": 0, "location": 0}).to_list(1000)
    return complaints

@api_router.get("/complaints/{complaint_id}", response_model=Complaint)
async def get_complaint(complaint_id: str, current_user: dict = Depends(get_current_user)):
    complaint = await db.complaints.find_one({"id": complaint_id}, {"_id": 0, "location": 0})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@api_router.put("/complaints/{complaint_id}")
async def update_complaint(
    complaint_id: str,
    complaint_update: ComplaintUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Only admins can update complaints
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update complaints")
    
    # Check if complaint exists
    existing_complaint = await db.complaints.find_one({"id": complaint_id})
    if not existing_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Update complaint
    update_data = complaint_update.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.complaints.update_one(
        {"id": complaint_id},
        {"$set": update_data}
    )
    
    # Get updated complaint
    updated_complaint = await db.complaints.find_one({"id": complaint_id}, {"_id": 0, "location": 0})
    return updated_complaint

# Category Routes
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

# Analytics Routes
@api_router.get("/analytics/stats")
async def get_analytics_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access analytics")
    
    total_complaints = await db.complaints.count_documents({})
    pending_complaints = await db.complaints.count_documents({"status": "pending"})
    in_progress_complaints = await db.complaints.count_documents({"status": "in_progress"})
    resolved_complaints = await db.complaints.count_documents({"status": "resolved"})
    
    return {
        "total": total_complaints,
        "pending": pending_complaints,
        "in_progress": in_progress_complaints,
        "resolved": resolved_complaints
    }

@api_router.get("/analytics/category-breakdown")
async def get_category_breakdown(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access analytics")
    
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    result = await db.complaints.aggregate(pipeline).to_list(100)
    return [{"category": item["_id"], "count": item["count"]} for item in result]

# Initialize default categories
@app.on_event("startup")
async def startup_event():
    # Check if categories exist
    count = await db.categories.count_documents({})
    if count == 0:
        default_categories = [
            {"id": str(uuid.uuid4()), "name": "Roads", "icon": "road"},
            {"id": str(uuid.uuid4()), "name": "Street Lighting", "icon": "lightbulb"},
            {"id": str(uuid.uuid4()), "name": "Sanitation", "icon": "trash-2"},
            {"id": str(uuid.uuid4()), "name": "Water Supply", "icon": "droplet"},
            {"id": str(uuid.uuid4()), "name": "Drainage", "icon": "waves"},
            {"id": str(uuid.uuid4()), "name": "Parks & Gardens", "icon": "tree-deciduous"},
            {"id": str(uuid.uuid4()), "name": "Other", "icon": "circle-alert"}
        ]
        await db.categories.insert_many(default_categories)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()