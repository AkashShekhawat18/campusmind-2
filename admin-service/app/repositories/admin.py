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
