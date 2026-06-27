import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    google_sub = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, default="")
    picture = Column(String, default="")
    role = Column(String, default="STUDENT")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
