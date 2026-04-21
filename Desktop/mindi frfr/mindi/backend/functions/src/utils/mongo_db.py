# =============================================================================
# MINDI — Utils: MongoDB DB Helper
# Provides a Firestore-like API surface used by backend modules.
# =============================================================================

import os
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any, Dict, List, Optional

from loguru import logger
from pymongo import MongoClient


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _deep_merge(base: Dict[str, Any], overlay: Dict[str, Any]) -> Dict[str, Any]:
    merged = deepcopy(base)
    for key, value in overlay.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


class MongoDocumentSnapshot:
    def __init__(self, doc_id: str, data: Optional[Dict[str, Any]]):
        self.id = doc_id
        self._data = data

    @property
    def exists(self) -> bool:
        return self._data is not None

    def to_dict(self) -> Dict[str, Any]:
        return deepcopy(self._data or {})


class MongoDocumentRef:
    def __init__(self, db, path_segments: List[str]):
        self._db = db
        self._path_segments = path_segments

    @property
    def _path(self) -> str:
        return "/".join(self._path_segments)

    @property
    def _doc_id(self) -> str:
        return self._path_segments[-1]

    def collection(self, name: str):
        return MongoCollectionRef(self._db, [*self._path_segments, name])

    def get(self) -> MongoDocumentSnapshot:
        rec = self._db.fs_docs.find_one({"_id": self._path}, {"data": 1})
        return MongoDocumentSnapshot(self._doc_id, rec.get("data") if rec else None)

    def set(self, payload: Dict[str, Any], merge: bool = False) -> None:
        existing = self._db.fs_docs.find_one({"_id": self._path}, {"data": 1})
        current_data = existing.get("data", {}) if existing else {}
        next_data = _deep_merge(current_data, payload) if merge else deepcopy(payload)

        self._db.fs_docs.update_one(
            {"_id": self._path},
            {
                "$set": {
                    "data": next_data,
                    "updatedAt": _now_iso(),
                    "collection": self._path_segments[-2] if len(self._path_segments) >= 2 else None,
                },
                "$setOnInsert": {"createdAt": _now_iso()},
            },
            upsert=True,
        )

    def update(self, payload: Dict[str, Any]) -> None:
        set_ops = {f"data.{k}": v for k, v in payload.items()}
        set_ops["updatedAt"] = _now_iso()
        result = self._db.fs_docs.update_one({"_id": self._path}, {"$set": set_ops})
        if result.matched_count == 0:
            raise ValueError(f"Document does not exist: {self._path}")


class MongoCollectionRef:
    def __init__(self, db, path_segments: List[str]):
        self._db = db
        self._path_segments = path_segments

    def document(self, doc_id: str) -> MongoDocumentRef:
        return MongoDocumentRef(self._db, [*self._path_segments, doc_id])

    def add(self, payload: Dict[str, Any]) -> str:
        doc_id = payload.get("id") or str(uuid.uuid4())
        self.document(doc_id).set(payload, merge=False)
        return doc_id


class MongoFirestoreCompat:
    def __init__(self, db):
        self._db = db

    def collection(self, name: str) -> MongoCollectionRef:
        return MongoCollectionRef(self._db, [name])


def init_mongo() -> None:
    """Initialize MongoDB and indexes. Called once on app startup."""
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise RuntimeError("MONGODB_URI is not set")

    client = _get_mongo_client()
    client.admin.command("ping")

    db = _get_mongo_database()
    db.fs_docs.create_index("collection")
    db.fs_docs.create_index("updatedAt")
    logger.info("MongoDB initialized")


# Backward-compatible alias so existing imports keep working during migration.

@lru_cache(maxsize=1)
def _get_mongo_client() -> MongoClient:
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise RuntimeError("MONGODB_URI is not set")
    return MongoClient(uri)


@lru_cache(maxsize=1)
def _get_mongo_database():
    db_name = os.getenv("MONGODB_DB", "mindi")
    return _get_mongo_client()[db_name]


@lru_cache(maxsize=1)
def get_db() -> MongoFirestoreCompat:
    """Get MongoDB-backed Firestore-compat client (cached singleton)."""
    return MongoFirestoreCompat(_get_mongo_database())
