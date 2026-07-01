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
