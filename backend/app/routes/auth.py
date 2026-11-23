from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.database.mongodb import get_database
from app.security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_byte_limit(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be no longer than 72 UTF-8 bytes.")
        return value

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name must contain at least two non-space characters.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

    @field_validator("password")
    @classmethod
    def password_byte_limit(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password is too long.")
        return value


def _auth_response(user: dict) -> dict:
    token, expires_in = create_access_token(user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "user": {"name": user["name"], "email": user["email"]},
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    email = str(request.email).lower().strip()
    try:
        db = get_database()
        if await db.users.find_one({"email": email}):
            raise HTTPException(status_code=409, detail="An account with this email already exists.")

        now = datetime.now(timezone.utc)
        user = {
            "name": request.name.strip(),
            "email": email,
            "password_hash": hash_password(request.password),
            "subjects": [],
            "learning_goals": [],
            "knowledge_level": "beginner",
            "learning_preferences": [],
            "strengths": [],
            "weak_topics": [],
            "misconceptions": [],
            "created_at": now,
            "updated_at": now,
        }
        response = _auth_response(user)  # Validate JWT configuration before writing the account.
        await db.users.insert_one(user)
        return response
    except HTTPException:
        raise
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Registration is temporarily unavailable.")


@router.post("/login")
async def login(request: LoginRequest):
    email = str(request.email).lower().strip()
    try:
        user = await get_database().users.find_one({"email": email})
    except PyMongoError:
        raise HTTPException(status_code=503, detail="Login is temporarily unavailable.")

    if not user or not user.get("password_hash") or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _auth_response(user)


@router.get("/me")
async def current_profile(user: dict = Depends(get_current_user)):
    return {"name": user["name"], "email": user["email"]}
