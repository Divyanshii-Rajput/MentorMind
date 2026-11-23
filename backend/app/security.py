import os
import jwt
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.errors import PyMongoError

from app.database.mongodb import get_database

bearer_scheme = HTTPBearer(auto_error=False)
ALGORITHM = "HS256"
TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
if TOKEN_MINUTES < 1 or TOKEN_MINUTES > 1440:
    raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be between 1 and 1440.")


def _secret() -> str:
    secret = os.getenv("JWT_SECRET", "")
    if len(secret.encode("utf-8")) < 32:
        raise RuntimeError(
            "JWT_SECRET must contain at least 32 bytes. Generate one with: "
            "python -c \"import secrets; print(secrets.token_urlsafe(48))\""
        )
    return secret


def hash_password(password: str) -> str:
    raw = password.encode("utf-8")
    if len(raw) > 72:
        raise ValueError("Password must be no longer than 72 UTF-8 bytes.")
    return bcrypt.hashpw(raw, bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(email: str) -> tuple[str, int]:
    expires = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_MINUTES)
    payload = {
        "sub": email.lower(),
        "iat": datetime.now(timezone.utc),
        "exp": expires,
    }
    return jwt.encode(payload, _secret(), algorithm=ALGORITHM), TOKEN_MINUTES * 60


async def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> dict[str, Any]:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise credentials_error
    try:
        payload = jwt.decode(credentials.credentials, _secret(), algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not isinstance(email, str) or not email:
            raise credentials_error
    except (jwt.InvalidTokenError, RuntimeError):
        raise credentials_error

    try:
        user = await get_database().users.find_one({"email": email.lower()})
    except PyMongoError:
        raise HTTPException(status_code=503, detail="User service is temporarily unavailable.")

    if not user:
        raise credentials_error
    return user


async def enforce_resource_owner(
    request: Request,
    user: dict = Depends(get_current_user),
) -> None:
    """Authenticate all application routers and enforce URL-based student ownership."""
    email = user["email"].lower()
    request.state.current_user = user

    for key in ("email", "student_email"):
        requested = request.path_params.get(key)
        if requested is not None and str(requested).strip().lower() != email:
            raise HTTPException(status_code=403, detail="You cannot access another student's data.")

    quiz_id = request.path_params.get("quiz_id")
    if quiz_id:
        from bson import ObjectId
        from bson.errors import InvalidId

        try:
            quiz = await get_database().quizzes.find_one({"_id": ObjectId(quiz_id)})
        except (InvalidId, TypeError):
            raise HTTPException(status_code=400, detail="Invalid quiz ID.")
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found.")
        quiz_owner = (quiz.get("student_email") or "").lower()
        if quiz_owner != email:
            raise HTTPException(status_code=403, detail="You cannot access another student's quiz.")
