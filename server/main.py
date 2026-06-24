
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import tempfile
from datetime import date, datetime
from collections import defaultdict
import uuid
from model import video_stream
from state import VIDEO_STORE, VIDEO_RESULTS
from schemas import UserCreate, UserLogin, UserResponse, ProfileResponse, ProfileUpdate
from database import analysis_collection, user_collection, Notification_collection
from bson import ObjectId
from utils import hash_password, verify_password

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-video")
async def upload_video(file: UploadFile = File(...), user_id: str = Form(...)):
    video_id = str(uuid.uuid4())

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp:
        temp.write(await file.read())

    VIDEO_STORE[video_id] = {
        "path":      temp.name,
        "user_id":   user_id,
        "finalized": False          # ← track finalization from the start
    }

    return {"video_id": video_id}


@app.get("/stream-video/{video_id}")
def stream_video(video_id: str):
    meta = VIDEO_STORE.get(video_id)

    if not meta:
        raise HTTPException(status_code=400, detail="Invalid video id")

    return StreamingResponse(
        video_stream(meta["path"], video_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.post("/register", response_model=UserResponse)
async def register(data: UserCreate):
    existing_user = await user_collection.find_one({"email": data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = {
        "firstName": data.firstName,
        "lastName":  data.lastName,
        "email":     data.email,
        "password":  hash_password(data.password)
    }

    result = await user_collection.insert_one(new_user)

    return {
        "user_id":   str(result.inserted_id),
        "firstName": data.firstName,
        "lastName":  data.lastName,
        "email":     data.email
    }


@app.post("/login", response_model=UserResponse)
async def login(data: UserLogin):
    user = await user_collection.find_one({"email": data.email})

    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "user_id":   str(user["_id"]),
        "firstName": user["firstName"],
        "lastName":  user["lastName"],
        "email":     user["email"]
    }

@app.post("/finalize/{video_id}")
async def finalize_video(video_id: str):
    result = VIDEO_RESULTS.get(video_id)
    meta   = VIDEO_STORE.get(video_id)

    if not meta:
        raise HTTPException(status_code=400, detail="Invalid video id")

    if not result:
        raise HTTPException(status_code=400, detail="Analysis not ready yet")

    # ── KEY FIX: if already finalized, return the result without saving again ──
    if meta.get("finalized"):
        return {
            "status":           result["status"],
            "unsafe_types":     result["unsafe_types"],
            "safe_activities":  result["safe_activities"],
            "confidence_score": result["confidence_score"],
            "counts":           result["counts"]
        }

    # Mark finalized BEFORE any await so concurrent calls are blocked
    meta["finalized"] = True

    analysis = {
        "user_id":          meta["user_id"],
        "date":             str(date.today()),
        "status":           result["status"],
        "unsafe_types":     result["unsafe_types"],
        "confidence_score": result["confidence_score"],
        "counts":           result["counts"]
    }

    # Send notification only for unsafe videos
    if len(result["unsafe_types"]) > 0:
        try:
            user_oid = ObjectId(meta["user_id"])
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user id")

        user = await user_collection.find_one(
            {"_id": user_oid},
            {"email": 1}
        )

        notification = {
            "user_id":    meta["user_id"],
            "user_email": user["email"] if user else None,
            "message":    f"Unsafe activities detected: {', '.join(result['unsafe_types'])}",
            "timestamp":  datetime.utcnow()
        }

        await Notification_collection.insert_one(notification)

    # Save analysis ONCE
    await analysis_collection.insert_one(analysis)

    return {
        "status":           result["status"],
        "unsafe_types":     result["unsafe_types"],
        "safe_activities":  result["safe_activities"],
        "confidence_score": result["confidence_score"],
        "counts":           result["counts"]
    }


@app.get("/notification/{user_id}")
async def get_notification(user_id: str):
    cursor = Notification_collection.find(
        {"user_id": user_id},
        {"_id": 1, "message": 1, "timestamp": 1}
    ).sort("timestamp", -1)

    results = []
    async for doc in cursor:
        results.append({
            "_id":       str(doc["_id"]),
            "message":   doc["message"],
            "timestamp": doc["timestamp"]
        })
    return results


@app.delete("/notification/{notification_id}")
async def delete_notification(notification_id: str):
    try:
        nid = ObjectId(notification_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification id")

    result = await Notification_collection.delete_one({"_id": nid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification deleted"}


@app.get("/history/{user_id}")
async def get_history(user_id: str):
    cursor = analysis_collection.find(
        {"user_id": user_id},
        {"_id": 1, "date": 1, "status": 1, "confidence_score": 1}
    )

    results = []
    async for doc in cursor:
        results.append({
            "_id":              str(doc["_id"]),
            "date":             doc["date"],
            "status":           doc["status"],
            "confidence_score": doc.get("confidence_score", 0.0)
        })
    return results


@app.post("/history/delete")
async def delete_history(data: dict):
    try:
        ids = [ObjectId(i) for i in data["ids"]]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id list")

    await analysis_collection.delete_many({"_id": {"$in": ids}})
    return {"deleted": len(ids)}


@app.get("/getp/{user_id}", response_model=ProfileResponse)
async def get_profile(user_id: str):
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = await user_collection.find_one(
        {"_id": oid},
        {"password": 0}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_id":   str(user["_id"]),
        "firstName": user["firstName"],
        "lastName":  user["lastName"],
        "email":     user["email"],
        "location":  user.get("location")
    }


@app.put("/upp/{user_id}")
async def update_profile(user_id: str, data: ProfileUpdate):
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    update_data = {k: v for k, v in data.dict().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    result = await user_collection.update_one(
        {"_id": oid},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Profile updated successfully"}


@app.get("/analytics/line/{user_id}")
async def line_graph_by_path(user_id: str):
    """Legacy route — kept for backward compatibility."""
    return await _line_graph_data(user_id, group_by="date")


@app.get("/analytics/line")
async def line_graph_by_query(
    user_id:  str,
    group_by: str       = "date",   # date | month | year | weekday
    year:     int | None = None
):
    return await _line_graph_data(user_id, group_by=group_by, year=year)


async def _line_graph_data(
    user_id:  str,
    group_by: str       = "date",
    year:     int | None = None
):
    """Shared implementation for both line graph routes."""
    cursor = analysis_collection.find({"user_id": user_id})
    data   = defaultdict(int)

    async for doc in cursor:
        d = datetime.strptime(doc["date"], "%Y-%m-%d")

        if year and d.year != year:
            continue

        if group_by == "date":
            key = doc["date"]
        elif group_by == "month":
            key = d.strftime("%Y-%m")
        elif group_by == "year":
            key = str(d.year)
        elif group_by == "weekday":
            key = d.strftime("%A")
        else:
            continue

        data[key] += sum(doc["counts"].values())

    return dict(data)


@app.get("/analytics/pie")
async def pie_chart(
    user_id:  str,
    group_by: str,    
    value:    str     
):
    cursor = analysis_collection.find({"user_id": user_id})
    result = {"FIRE": 0, "SMOKING": 0, "VEHICLE": 0}

    async for doc in cursor:
        d = datetime.strptime(doc["date"], "%Y-%m-%d")

        if group_by == "date"    and doc["date"] != value:              
            continue
        if group_by == "month"   and d.strftime("%Y-%m") != value:      
            continue
        if group_by == "year"    and str(d.year) != value:              
            continue
        if group_by == "weekday" and d.strftime("%A") != value:         
            continue

        for k in result:
            result[k] += doc["counts"].get(k, 0)

    return result


