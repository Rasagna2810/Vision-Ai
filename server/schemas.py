# from pydantic import BaseModel, EmailStr
# from datetime import datetime

# class UserBase(BaseModel):
#     email: EmailStr

# class UserCreate(UserBase):
#     firstName: str
#     lastName: str
#     password: str

# class UserLogin(UserBase):
#     password: str

# class UserResponse(BaseModel):
#     firstName: str
#     lastName: str
#     email: EmailStr
# class UnsafeEvent(BaseModel):
#     type: str        # FIRE | SMOKING | VEHICLE
#     confidence: float
#     timestamp: datetime
#     session_id: str
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import List, Dict, Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    firstName: str
    lastName: str
    password: str
    location: Optional[str] = None

class UserLogin(UserBase):
    password: str

class UserResponse(BaseModel):
    user_id: str
    firstName: str
    lastName: str
    email: EmailStr


class UnsafeEvent(BaseModel):
    user_email: EmailStr 
    type: str        # FIRE | SMOKING | VEHICLE
    confidence: float
    timestamp: datetime
    session_id: str

# 🔥 FINAL AGGREGATED RESULT
class VideoAnalysis(BaseModel):
    user_id: str 
    date: str
    status: str                # SAFE | UNSAFE
    unsafe_types: List[str]
    counts: Dict[str, int]
    confidence_score: float 
class Notification(BaseModel):
    user_id: str
    user_email: EmailStr
    message: str
    timestamp: datetime

class ProfileResponse(BaseModel):
    user_id: str
    firstName: str
    lastName: str
    email: EmailStr
    location: Optional[str] = None


class ProfileUpdate(BaseModel):
    firstName: Optional[str] = None
    location: Optional[str] = None

