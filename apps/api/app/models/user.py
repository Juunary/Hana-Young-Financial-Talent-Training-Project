import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


def generate_public_id() -> str:
    """Generate a UUID v4 string for external IDs (IDOR prevention)."""
    return str(uuid.uuid4())


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(
        String(36), unique=True, index=True, default=generate_public_id
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="user")
    is_active: Mapped[bool] = mapped_column(default=True)
    is_email_verified: Mapped[bool] = mapped_column(default=False)

    profile: Mapped["UserProfile | None"] = relationship(
        back_populates="user", uselist=False, lazy="selectin"
    )
    consent_records: Mapped[list["ConsentRecord"]] = relationship(
        back_populates="user", lazy="selectin"
    )


class UserProfile(TimestampMixin, Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    birth_year: Mapped[int | None]
    university: Mapped[str | None] = mapped_column(String(200))
    major: Mapped[str | None] = mapped_column(String(200))
    graduation_status: Mapped[str | None] = mapped_column(String(30))
    employment_status: Mapped[str | None] = mapped_column(String(30))

    user: Mapped["User"] = relationship(back_populates="profile")


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    consent_type: Mapped[str] = mapped_column(String(50))
    consent_version: Mapped[str] = mapped_column(String(20))
    accepted: Mapped[bool]
    accepted_at: Mapped[str] = mapped_column(String(30))
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="consent_records")
