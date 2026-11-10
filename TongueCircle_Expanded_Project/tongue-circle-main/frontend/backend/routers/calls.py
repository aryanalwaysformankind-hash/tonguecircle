"""Authenticated WebRTC signalling for one-to-one audio/video calls.

Media travels peer-to-peer; this API only stores short-lived SDP/ICE signalling.
For production deployments, configure a TURN service in the frontend ICE config.
"""
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from clerk_auth import require_user
from lib.db import db

router = APIRouter()


class StartCall(BaseModel):
    conversation_id: str = Field(min_length=1, max_length=100)
    call_type: str = Field(pattern="^(audio|video)$")
    offer: dict[str, Any]


class CallUpdate(BaseModel):
    answer: dict[str, Any] | None = None
    candidate: dict[str, Any] | None = None
    status: str | None = Field(default=None, pattern="^(accepted|rejected|ended)$")


def _public(doc: dict, user_id: str) -> dict:
    return {
        "id": doc["id"], "conversation_id": doc["conversation_id"],
        "caller_id": doc["caller_id"], "callee_id": doc["callee_id"],
        "call_type": doc["call_type"], "offer": doc.get("offer"),
        "answer": doc.get("answer"),
        "caller_candidates": doc.get("caller_candidates", []),
        "callee_candidates": doc.get("callee_candidates", []),
        "status": doc.get("status", "ringing"),
        "created_at": doc["created_at"].isoformat(),
        "is_caller": doc["caller_id"] == user_id,
    }


async def _participant(call_id: str, user_id: str) -> dict:
    doc = await db.calls.find_one({"id": call_id, "$or": [{"caller_id": user_id}, {"callee_id": user_id}]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Call not found")
    return doc


@router.post("/calls")
async def start_call(body: StartCall, user: dict = Depends(require_user)):
    conversation = await db.conversations.find_one({"id": body.conversation_id, "participant_ids": user["user_id"]}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    other = next((item for item in conversation["participant_ids"] if item != user["user_id"]), None)
    if not other:
        raise HTTPException(status_code=400, detail="A call needs two participants")
    now = datetime.now(timezone.utc)
    await db.calls.update_many({"conversation_id": body.conversation_id, "status": {"$in": ["ringing", "accepted"]}}, {"$set": {"status": "ended"}})
    doc = {"id": str(uuid4()), "conversation_id": body.conversation_id, "caller_id": user["user_id"], "callee_id": other, "call_type": body.call_type, "offer": body.offer, "answer": None, "caller_candidates": [], "callee_candidates": [], "status": "ringing", "created_at": now, "updated_at": now}
    await db.calls.insert_one(doc)
    return _public(doc, user["user_id"])


@router.get("/calls/incoming")
async def incoming_calls(user: dict = Depends(require_user)):
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    docs = await db.calls.find({"callee_id": user["user_id"], "status": "ringing", "created_at": {"$gte": cutoff}}, {"_id": 0}).sort("created_at", -1).to_list(10)
    return [_public(doc, user["user_id"]) for doc in docs]


@router.get("/calls/{call_id}")
async def get_call(call_id: str, user: dict = Depends(require_user)):
    doc = await _participant(call_id, user["user_id"])
    if doc.get("status") == "ringing" and doc["created_at"] < datetime.now(timezone.utc) - timedelta(seconds=60):
        await db.calls.update_one({"id": call_id}, {"$set": {"status": "ended", "updated_at": datetime.now(timezone.utc)}})
        doc["status"] = "ended"
    return _public(doc, user["user_id"])


@router.patch("/calls/{call_id}")
async def update_call(call_id: str, body: CallUpdate, user: dict = Depends(require_user)):
    doc = await _participant(call_id, user["user_id"])
    now = datetime.now(timezone.utc)
    update: dict[str, Any] = {"updated_at": now}
    if body.answer is not None:
        if user["user_id"] != doc["callee_id"]:
            raise HTTPException(status_code=403, detail="Only the recipient can answer this call")
        update["answer"] = body.answer
        update["status"] = "accepted"
    if body.candidate is not None:
        field = "caller_candidates" if user["user_id"] == doc["caller_id"] else "callee_candidates"
        await db.calls.update_one({"id": call_id}, {"$push": {field: body.candidate}, "$set": {"updated_at": now}})
    if body.status is not None:
        update["status"] = body.status
    if len(update) > 1:
        await db.calls.update_one({"id": call_id}, {"$set": update})
    return _public(await _participant(call_id, user["user_id"]), user["user_id"])
