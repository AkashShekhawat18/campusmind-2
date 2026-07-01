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
