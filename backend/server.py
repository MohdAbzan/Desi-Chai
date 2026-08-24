from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import uuid
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ----------------- Basic models / health -----------------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


@api_router.get("/")
async def root():
    return {"message": "Digital Chai & Coffee Lounge API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# ----------------- Realtime Lounge (in-memory, ephemeral) -----------------
class Room:
    def __init__(self):
        # client_id -> {"ws": WebSocket, "user": {...}}
        self.members: Dict[str, dict] = {}

    def roster(self):
        return [m["user"] for m in self.members.values() if m.get("user")]


class LoungeManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}

    def get_room(self, name: str) -> Room:
        if name not in self.rooms:
            self.rooms[name] = Room()
        return self.rooms[name]

    async def broadcast(self, room_name: str, message: dict, exclude: str = None):
        room = self.rooms.get(room_name)
        if not room:
            return
        payload = json.dumps(message)
        dead = []
        for cid, m in list(room.members.items()):
            if cid == exclude:
                continue
            try:
                await m["ws"].send_text(payload)
            except Exception:
                dead.append(cid)
        for cid in dead:
            room.members.pop(cid, None)


manager = LoungeManager()


@api_router.websocket("/ws/{room_name}")
async def lounge_ws(websocket: WebSocket, room_name: str):
    await websocket.accept()
    client_id = str(uuid.uuid4())
    room = manager.get_room(room_name)
    room.members[client_id] = {"ws": websocket, "user": None}

    await websocket.send_text(json.dumps({"type": "welcome", "id": client_id}))

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                continue

            mtype = data.get("type")

            if mtype == "join":
                user = data.get("user", {}) or {}
                user["id"] = client_id
                room.members[client_id]["user"] = user
                # send full roster to the newcomer
                await websocket.send_text(json.dumps({"type": "roster", "users": room.roster()}))
                # tell everyone else about the new roster
                await manager.broadcast(room_name, {"type": "roster", "users": room.roster()})

            elif mtype == "chat":
                text = (data.get("text") or "").strip()[:280]
                if not text:
                    continue
                u = room.members[client_id].get("user") or {}
                await manager.broadcast(room_name, {
                    "type": "chat",
                    "id": client_id,
                    "name": u.get("name", "Guest"),
                    "text": text,
                })

            elif mtype == "action":
                action = data.get("action")
                if action in {"drink", "cheers", "steam", "wave"}:
                    await manager.broadcast(room_name, {
                        "type": "action",
                        "id": client_id,
                        "action": action,
                    })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logging.getLogger(__name__).warning(f"ws error: {e}")
    finally:
        room.members.pop(client_id, None)
        await manager.broadcast(room_name, {"type": "roster", "users": room.roster()})
        if not room.members:
            manager.rooms.pop(room_name, None)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
