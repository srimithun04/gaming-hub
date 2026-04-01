from pydantic import BaseModel
from typing import Optional

class GameInput(BaseModel):
    title: str
    genre: str
    image_url: str
    crop_data: Optional[str] = None

class NewsInput(BaseModel):
    tag: str
    title: str
    description: str
    image_url: str

class AssetInput(BaseModel):
    image_url: str

# NEW: Validation for Community Posts
class PostInput(BaseModel):
    username: str
    game_title: Optional[str] = None
    content: Optional[str] = None
    media_url: str
    media_type: str = "image"

# Add this to the bottom of your schemas.py
class MessageInput(BaseModel):
    sender: str
    receiver: str
    content: str