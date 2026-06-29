from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
import datetime
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="STUDENT")
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

    chats = relationship("Chat", back_populates="user")
    auditLogs = relationship("AuditLog", back_populates="user")

class Chat(Base):
    __tablename__ = "Chat"

    id = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat")

class Message(Base):
    __tablename__ = "Message"

    id = Column(String, primary_key=True, default=generate_uuid)
    chatId = Column(String, ForeignKey("Chat.id", ondelete="CASCADE"))
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    fileReferences = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

    chat = relationship("Chat", back_populates="messages")

class AuditLog(Base):
    __tablename__ = "AuditLog"

    id = Column(String, primary_key=True, default=generate_uuid)
    action = Column(String, nullable=False)
    entityType = Column(String, nullable=True)
    entityId = Column(String, nullable=True)
    details = Column(String, nullable=True)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"))
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="auditLogs")

class College(Base):
    __tablename__ = "College"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    address = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

class Approval(Base):
    __tablename__ = "Approval"

    id = Column(String, primary_key=True, default=generate_uuid)
    entityType = Column(String, nullable=False) # e.g., "STUDENT", "TEACHER"
    entityId = Column(String, nullable=False)
    status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    requestedBy = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "Notification"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    audience = Column(String, nullable=False) # ALL, STUDENTS, TEACHERS, INDIVIDUAL
    targetId = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
