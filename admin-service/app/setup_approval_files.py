import os

def create_file(path, content):
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# schemas/approval.py
create_file("schemas/approval.py", """
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ApprovalBase(BaseModel):
    entityType: str
    entityId: str
    requestedBy: str

class ApprovalCreate(ApprovalBase):
    pass

class ApprovalUpdate(BaseModel):
    status: str
    reviewedBy: Optional[str] = None
    reviewNotes: Optional[str] = None

class ApprovalResponse(ApprovalBase):
    id: str
    status: str
    reviewedBy: Optional[str]
    reviewNotes: Optional[str]
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True
""")

# repositories/approval.py
create_file("repositories/approval.py", """
from sqlalchemy.orm import Session
from models.all_models import Approval
from schemas.approval import ApprovalCreate, ApprovalUpdate

class ApprovalRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_approval(self, approval_id: str):
        return self.db.query(Approval).filter(Approval.id == approval_id).first()

    def get_all_approvals(self):
        return self.db.query(Approval).order_by(Approval.createdAt.desc()).all()

    def create_approval(self, approval: ApprovalCreate):
        db_approval = Approval(
            entityType=approval.entityType,
            entityId=approval.entityId,
            requestedBy=approval.requestedBy
        )
        self.db.add(db_approval)
        self.db.commit()
        self.db.refresh(db_approval)
        return db_approval

    def update_approval(self, approval_id: str, approval_update: ApprovalUpdate):
        db_approval = self.get_approval(approval_id)
        if db_approval:
            db_approval.status = approval_update.status
            if approval_update.reviewedBy:
                db_approval.reviewedBy = approval_update.reviewedBy
            if approval_update.reviewNotes:
                db_approval.reviewNotes = approval_update.reviewNotes
            self.db.commit()
            self.db.refresh(db_approval)
        return db_approval
""")

# services/approval.py
create_file("services/approval.py", """
from sqlalchemy.orm import Session
from repositories.approval import ApprovalRepository
from schemas.approval import ApprovalCreate, ApprovalUpdate

class ApprovalService:
    def __init__(self, db: Session):
        self.repo = ApprovalRepository(db)

    def get_approval(self, approval_id: str):
        return self.repo.get_approval(approval_id)

    def get_all_approvals(self):
        return self.repo.get_all_approvals()

    def create_approval(self, approval: ApprovalCreate):
        return self.repo.create_approval(approval)

    def update_approval(self, approval_id: str, approval_update: ApprovalUpdate):
        return self.repo.update_approval(approval_id, approval_update)
""")

# routers/approval.py
create_file("routers/approval.py", """
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from schemas.approval import ApprovalCreate, ApprovalUpdate, ApprovalResponse
from services.approval import ApprovalService
from typing import List

router = APIRouter(prefix="/api/admin/approvals", tags=["Approvals"])

@router.get("/", response_model=List[ApprovalResponse])
def get_approvals(db: Session = Depends(get_db)):
    service = ApprovalService(db)
    return service.get_all_approvals()

@router.post("/", response_model=ApprovalResponse)
def create_approval(approval: ApprovalCreate, db: Session = Depends(get_db)):
    service = ApprovalService(db)
    return service.create_approval(approval)

@router.put("/{approval_id}", response_model=ApprovalResponse)
def update_approval(approval_id: str, approval_update: ApprovalUpdate, db: Session = Depends(get_db)):
    service = ApprovalService(db)
    approval = service.update_approval(approval_id, approval_update)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    return approval
""")

print("Scaffolded Approval Service successfully")
