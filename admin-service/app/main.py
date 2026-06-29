from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from passlib.context import CryptContext

from app.database import engine, Base, get_db
from app.models import User, Chat, Message, AuditLog, Approval, Notification

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CampusMind Admin API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/admin/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Demo logic
    if req.email == "admin@campusmind.ai" and req.password == "admin123":
        return {"access_token": "demo-jwt-token", "token_type": "bearer"}
    
    # Try actual DB
    user = db.query(User).filter(User.email == req.email, User.role == "ADMIN").first()
    if not user or not pwd_context.verify(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"access_token": "demo-jwt-token", "token_type": "bearer"}

@app.get("/api/admin/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_students = db.query(User).filter(User.role == "STUDENT").count()
    total_teachers = db.query(User).filter(User.role == "TEACHER").count()
    total_chats = db.query(Chat).count()
    pending_approvals = db.query(Approval).filter(Approval.status == "PENDING").count()

    return {
        "totalStudents": total_students,
        "totalTeachers": total_teachers,
        "totalChats": total_chats,
        "pendingApprovals": pending_approvals,
        "recentActivity": []
    }

@app.get("/api/admin/users")
def get_users(role: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.upper())
    users = query.all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "createdAt": u.createdAt} for u in users]

@app.get("/api/admin/chats")
def get_chats(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Chat)
    if user_id:
        query = query.filter(Chat.userId == user_id)
    chats = query.all()
    return [{"id": c.id, "title": c.title, "createdAt": c.createdAt, "userId": c.userId} for c in chats]

@app.get("/api/admin/chats/{chat_id}/messages")
def get_chat_messages(chat_id: str, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.chatId == chat_id).order_by(Message.createdAt.asc()).all()
    return [{"id": m.id, "role": m.role, "content": m.content, "createdAt": m.createdAt} for m in messages]

@app.get("/api/admin/approvals")
def get_approvals(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Approval)
    if status:
        query = query.filter(Approval.status == status.upper())
    approvals = query.order_by(Approval.createdAt.desc()).all()
    return [{
        "id": a.id,
        "entityType": a.entityType,
        "entityId": a.entityId,
        "status": a.status,
        "requestedBy": a.requestedBy,
        "createdAt": a.createdAt
    } for a in approvals]

@app.post("/api/admin/approvals/{approval_id}/approve")
def approve_request(approval_id: str, db: Session = Depends(get_db)):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    approval.status = "APPROVED"
    db.commit()
    return {"message": "Request approved successfully"}

@app.post("/api/admin/approvals/{approval_id}/reject")
def reject_request(approval_id: str, db: Session = Depends(get_db)):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    approval.status = "REJECTED"
    db.commit()
    return {"message": "Request rejected successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
