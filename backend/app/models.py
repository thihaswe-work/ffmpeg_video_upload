from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from .database import Base

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(String, primary_key=True, index=True)
    thumbnail_key = Column(String, nullable=False)
    manifest_key = Column(String, nullable=False)
    status = Column(String, default="completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
