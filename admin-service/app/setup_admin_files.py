import os

def create_file(path, content):
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# core/config.py
create_file("core/config.py", """
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "CampusMind Admin Service"
    DATABASE_URL: str = "sqlite:///../../backend/prisma/dev.db"
    SECRET_KEY: str = os.getenv("JWT_SECRET", "supersecretkey")
    ALGORITHM: str = "HS256"

settings = Settings()
""")

# schemas/admin.py
create_file("schemas/admin.py", """
from pydantic import BaseModel
from typing import Optional

class AdminBase(BaseModel):
    userId: str
    roleId: str

class AdminCreate(AdminBase):
    pass

class AdminResponse(AdminBase):
    id: str
    class Config:
        orm_mode = True
        from_attributes = True
""")

# repositories/admin.py
create_file("repositories/admin.py", """
from sqlalchemy.orm import Session
from models.all_models import Admin, User
from schemas.admin import AdminCreate

class AdminRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_admin(self, admin_id: str):
        return self.db.query(Admin).filter(Admin.id == admin_id).first()

    def get_admin_by_user_id(self, user_id: str):
        return self.db.query(Admin).filter(Admin.userId == user_id).first()

    def get_all_admins(self):
        return self.db.query(Admin).all()

    def create_admin(self, admin: AdminCreate):
        db_admin = Admin(userId=admin.userId, roleId=admin.roleId)
        self.db.add(db_admin)
        self.db.commit()
        self.db.refresh(db_admin)
        return db_admin
""")

# services/admin.py
create_file("services/admin.py", """
from sqlalchemy.orm import Session
from repositories.admin import AdminRepository
from schemas.admin import AdminCreate

class AdminService:
    def __init__(self, db: Session):
        self.repo = AdminRepository(db)

    def get_admin(self, admin_id: str):
        return self.repo.get_admin(admin_id)

    def get_all_admins(self):
        return self.repo.get_all_admins()

    def create_admin(self, admin: AdminCreate):
        # Additional business logic can go here
        return self.repo.create_admin(admin)
""")

# routers/admin.py
create_file("routers/admin.py", """
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from schemas.admin import AdminCreate, AdminResponse
from services.admin import AdminService
from typing import List

router = APIRouter(prefix="/api/admin/admins", tags=["Admins"])

@router.get("/", response_model=List[AdminResponse])
def get_admins(db: Session = Depends(get_db)):
    service = AdminService(db)
    return service.get_all_admins()

@router.post("/", response_model=AdminResponse)
def create_admin(admin: AdminCreate, db: Session = Depends(get_db)):
    service = AdminService(db)
    return service.create_admin(admin)

@router.get("/{admin_id}", response_model=AdminResponse)
def get_admin(admin_id: str, db: Session = Depends(get_db)):
    service = AdminService(db)
    admin = service.get_admin(admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin
""")

# main.py
create_file("main.py", """
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import admin

app = FastAPI(title="CampusMind Admin Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)

@app.get("/")
def root():
    return {"message": "Admin Service is running"}
""")

print("Scaffolded Admin Service successfully")
