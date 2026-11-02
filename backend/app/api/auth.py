import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash
from sqlalchemy import DateTime, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column
from sqlalchemy.orm import sessionmaker
from itsdangerous import BadSignature, URLSafeTimedSerializer


# --------------------------------------------------
# Configuration
# --------------------------------------------------

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATABASE_DIR = PROJECT_ROOT / "storage"
DATABASE_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{(DATABASE_DIR / 'stagesense.db').as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)

password_hasher = PasswordHash.recommended()

SECRET_KEY = os.environ.get("STAGESENSE_SECRET_KEY")

if not SECRET_KEY:
    SECRET_KEY = uuid4().hex + uuid4().hex

serializer = URLSafeTimedSerializer(
    SECRET_KEY,
    salt="stagesense-auth-session",
)

SESSION_COOKIE = "stagesense_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 7


# --------------------------------------------------
# Database
# --------------------------------------------------

class Base(DeclarativeBase):
    pass


class UserRecord(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4()),
    )

    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        index=True,
        nullable=False,
    )

    display_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------
# Request and response schemas
# --------------------------------------------------

class RegisterRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: datetime


def serialize_user(user: UserRecord) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "created_at": user.created_at.isoformat(),
    }


# --------------------------------------------------
# Session helpers
# --------------------------------------------------

def set_session_cookie(response: Response, user_id: str):
    token = serializer.dumps({"user_id": user_id})

    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=os.environ.get("STAGESENSE_COOKIE_SECURE") == "true",
        samesite="lax",
        path="/",
    )


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    token = request.cookies.get(SESSION_COOKIE)

    if not token:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "UNAUTHENTICATED",
                "message": "Please sign in to continue.",
            },
        )

    try:
        session_data = serializer.loads(
            token,
            max_age=SESSION_MAX_AGE,
        )
        user_id = session_data.get("user_id")

    except BadSignature:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "UNAUTHENTICATED",
                "message": "Your session is invalid or expired.",
            },
        )

    user = db.get(UserRecord, user_id)

    if not user:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "UNAUTHENTICATED",
                "message": "User account not found.",
            },
        )

    return user


# --------------------------------------------------
# Register
# --------------------------------------------------

@router.post("/register", status_code=201)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()
    display_name = payload.display_name.strip()

    if not display_name:
        raise HTTPException(
            status_code=422,
            detail="Display name cannot be empty.",
        )

    existing_user = db.scalar(
        select(UserRecord).where(UserRecord.email == email)
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "EMAIL_ALREADY_EXISTS",
                "message": "An account with this email already exists.",
            },
        )

    user = UserRecord(
        email=email,
        display_name=display_name,
        password_hash=password_hasher.hash(payload.password),
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not create the account.",
        )

    set_session_cookie(response, user.id)

    return {"user": serialize_user(user)}


# --------------------------------------------------
# Login
# --------------------------------------------------

@router.post("/login")
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    user = db.scalar(
        select(UserRecord).where(UserRecord.email == email)
    )

    if not user or not password_hasher.verify(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail={
                "code": "INVALID_CREDENTIALS",
                "message": "Email or password is incorrect.",
            },
        )

    set_session_cookie(response, user.id)

    return {"user": serialize_user(user)}


# --------------------------------------------------
# Current user
# --------------------------------------------------

@router.get("/me")
def me(user: UserRecord = Depends(get_current_user)):
    return {"user": serialize_user(user)}


# --------------------------------------------------
# Logout
# --------------------------------------------------

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=SESSION_COOKIE,
        path="/",
        httponly=True,
        secure=os.environ.get("STAGESENSE_COOKIE_SECURE") == "true",
        samesite="lax",
    )

    return {"message": "Signed out successfully."}