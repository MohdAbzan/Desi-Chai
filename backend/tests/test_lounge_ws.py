"""Backend tests for Digital Chai & Coffee Lounge WebSocket + REST endpoints."""
import asyncio
import json
import os
import pytest
import requests
import websockets

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or "https://brew-together-1.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
WS_BASE = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/api/ws"
WS_URL = WS_BASE + "/lounge"


def ws_for(room):
    return f"{WS_BASE}/{room}"


# ---------------- REST sanity ----------------
def test_api_root():
    r = requests.get(f"{BASE_URL}/api/", timeout=10)
    assert r.status_code == 200
    assert "message" in r.json()


# ---------------- WebSocket helpers ----------------
async def recv_json(ws, timeout=5):
    raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
    return json.loads(raw)


async def recv_until(ws, mtype, timeout=5):
    end = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < end:
        remaining = end - asyncio.get_event_loop().time()
        msg = await asyncio.wait_for(ws.recv(), timeout=max(0.1, remaining))
        data = json.loads(msg)
        if data.get("type") == mtype:
            return data
    raise AssertionError(f"Did not receive message type {mtype}")


# ---------------- WS Tests ----------------
@pytest.mark.asyncio
async def test_welcome_message():
    async with websockets.connect(WS_URL) as ws:
        msg = await recv_json(ws)
        assert msg["type"] == "welcome"
        assert isinstance(msg["id"], str) and len(msg["id"]) > 0


@pytest.mark.asyncio
async def test_join_returns_roster():
    async with websockets.connect(WS_URL) as ws:
        await recv_until(ws, "welcome")
        await ws.send(json.dumps({"type": "join", "user": {"name": "TEST_Alice", "drink": "chai"}}))
        roster = await recv_until(ws, "roster")
        assert "users" in roster
        names = [u.get("name") for u in roster["users"]]
        assert "TEST_Alice" in names


@pytest.mark.asyncio
async def test_chat_broadcast_includes_sender():
    async with websockets.connect(WS_URL) as ws:
        await recv_until(ws, "welcome")
        await ws.send(json.dumps({"type": "join", "user": {"name": "TEST_Bob"}}))
        await recv_until(ws, "roster")
        await ws.send(json.dumps({"type": "chat", "text": "hello world"}))
        chat = await recv_until(ws, "chat")
        assert chat["text"] == "hello world"
        assert chat["name"] == "TEST_Bob"
        assert "id" in chat


@pytest.mark.asyncio
async def test_empty_chat_ignored():
    async with websockets.connect(WS_URL) as ws:
        await recv_until(ws, "welcome")
        await ws.send(json.dumps({"type": "join", "user": {"name": "TEST_Empty"}}))
        await recv_until(ws, "roster")
        await ws.send(json.dumps({"type": "chat", "text": "   "}))
        await ws.send(json.dumps({"type": "chat", "text": "real msg"}))
        chat = await recv_until(ws, "chat")
        # Only "real msg" should come through
        assert chat["text"] == "real msg"


@pytest.mark.asyncio
@pytest.mark.parametrize("action", ["drink", "cheers", "steam", "wave"])
async def test_valid_actions_broadcast(action):
    async with websockets.connect(WS_URL) as ws:
        await recv_until(ws, "welcome")
        await ws.send(json.dumps({"type": "join", "user": {"name": "TEST_ActUser"}}))
        await recv_until(ws, "roster")
        await ws.send(json.dumps({"type": "action", "action": action}))
        msg = await recv_until(ws, "action")
        assert msg["action"] == action


@pytest.mark.asyncio
async def test_invalid_action_ignored():
    async with websockets.connect(WS_URL) as ws:
        await recv_until(ws, "welcome")
        await ws.send(json.dumps({"type": "join", "user": {"name": "TEST_Inv"}}))
        await recv_until(ws, "roster")
        await ws.send(json.dumps({"type": "action", "action": "explode"}))
        await ws.send(json.dumps({"type": "chat", "text": "after invalid"}))
        chat = await recv_until(ws, "chat")
        assert chat["text"] == "after invalid"


@pytest.mark.asyncio
async def test_two_clients_chat_and_disconnect_roster():
    a = await websockets.connect(WS_URL)
    b = await websockets.connect(WS_URL)
    try:
        await recv_until(a, "welcome")
        await recv_until(b, "welcome")

        await a.send(json.dumps({"type": "join", "user": {"name": "TEST_A"}}))
        await recv_until(a, "roster")
        await b.send(json.dumps({"type": "join", "user": {"name": "TEST_B"}}))
        # Drain rosters until both users appear on B
        names_b = []
        for _ in range(5):
            roster_b = await recv_until(b, "roster")
            names_b = [u["name"] for u in roster_b["users"]]
            if "TEST_A" in names_b and "TEST_B" in names_b:
                break
        assert "TEST_A" in names_b and "TEST_B" in names_b

        # A should also see B eventually
        names_a = []
        for _ in range(5):
            roster_a = await recv_until(a, "roster")
            names_a = [u["name"] for u in roster_a["users"]]
            if "TEST_B" in names_a:
                break
        assert "TEST_B" in names_a

        await a.send(json.dumps({"type": "chat", "text": "hi from A"}))
        chat_b = await recv_until(b, "chat")
        assert chat_b["text"] == "hi from A"
        assert chat_b["name"] == "TEST_A"

        # Action from B reaches A
        await b.send(json.dumps({"type": "action", "action": "cheers"}))
        act_a = await recv_until(a, "action")
        assert act_a["action"] == "cheers"

        # Disconnect A -> B receives updated roster without TEST_A
        await a.close()
        roster_after = await recv_until(b, "roster", timeout=5)
        names_after = [u["name"] for u in roster_after["users"]]
        assert "TEST_A" not in names_after
        assert "TEST_B" in names_after
    finally:
        try:
            await a.close()
        except Exception:
            pass
        await b.close()


# ---------------- Iteration 2: Named rooms + typing ----------------
import uuid as _uuid

@pytest.mark.asyncio
async def test_rooms_are_isolated():
    room_a = f"test-{_uuid.uuid4().hex[:8]}"
    room_b = f"test-{_uuid.uuid4().hex[:8]}"
    a = await websockets.connect(ws_for(room_a))
    b = await websockets.connect(ws_for(room_b))
    try:
        await recv_until(a, "welcome")
        await recv_until(b, "welcome")
        await a.send(json.dumps({"type": "join", "user": {"name": "TEST_RoomA"}}))
        await recv_until(a, "roster")
        await b.send(json.dumps({"type": "join", "user": {"name": "TEST_RoomB"}}))
        await recv_until(b, "roster")
        # Drain any additional buffered messages on both sides
        for _ws in (a, b):
            while True:
                try:
                    await asyncio.wait_for(_ws.recv(), timeout=0.4)
                except asyncio.TimeoutError:
                    break
        # Send chat in room A; B should NOT receive it
        await a.send(json.dumps({"type": "chat", "text": "isolated msg"}))
        await recv_until(a, "chat")  # sender gets it
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(b.recv(), timeout=1.5)
    finally:
        await a.close(); await b.close()


@pytest.mark.asyncio
async def test_same_room_sees_each_other():
    room = f"test-{_uuid.uuid4().hex[:8]}"
    a = await websockets.connect(ws_for(room))
    b = await websockets.connect(ws_for(room))
    try:
        await recv_until(a, "welcome")
        await recv_until(b, "welcome")
        await a.send(json.dumps({"type": "join", "user": {"name": "TEST_SameA"}}))
        await recv_until(a, "roster")
        await b.send(json.dumps({"type": "join", "user": {"name": "TEST_SameB"}}))
        # Drain until both users are on B's roster
        names_b = []
        for _ in range(5):
            r = await recv_until(b, "roster")
            names_b = [u["name"] for u in r["users"]]
            if "TEST_SameA" in names_b and "TEST_SameB" in names_b:
                break
        assert "TEST_SameA" in names_b and "TEST_SameB" in names_b
        # A sends chat, B receives
        await a.send(json.dumps({"type": "chat", "text": "same-room hello"}))
        msg = await recv_until(b, "chat")
        assert msg["text"] == "same-room hello"
    finally:
        await a.close(); await b.close()


@pytest.mark.asyncio
async def test_typing_broadcast_excludes_sender():
    room = f"test-{_uuid.uuid4().hex[:8]}"
    a = await websockets.connect(ws_for(room))
    b = await websockets.connect(ws_for(room))
    try:
        await recv_until(a, "welcome")
        await recv_until(b, "welcome")
        await a.send(json.dumps({"type": "join", "user": {"name": "TEST_TypeA"}}))
        await recv_until(a, "roster")
        await b.send(json.dumps({"type": "join", "user": {"name": "TEST_TypeB"}}))
        # drain rosters
        for _ in range(3):
            try:
                await asyncio.wait_for(a.recv(), timeout=0.5)
            except asyncio.TimeoutError:
                break
        for _ in range(3):
            try:
                await asyncio.wait_for(b.recv(), timeout=0.5)
            except asyncio.TimeoutError:
                break
        # A sends typing true -> B should receive; A should not echo
        await a.send(json.dumps({"type": "typing", "active": True}))
        t = await recv_until(b, "typing")
        assert t["active"] is True
        assert t["name"] == "TEST_TypeA"
        assert "id" in t
        # Sender A should NOT get its own echo
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(a.recv(), timeout=1.0)
        # active:false forwarded too
        await a.send(json.dumps({"type": "typing", "active": False}))
        t2 = await recv_until(b, "typing")
        assert t2["active"] is False
    finally:
        await a.close(); await b.close()
