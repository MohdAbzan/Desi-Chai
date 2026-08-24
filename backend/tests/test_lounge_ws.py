"""Backend tests for Digital Chai & Coffee Lounge WebSocket + REST endpoints."""
import asyncio
import json
import os
import pytest
import requests
import websockets

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or "https://brew-together-1.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
WS_URL = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/api/ws/lounge"


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
