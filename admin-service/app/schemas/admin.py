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
