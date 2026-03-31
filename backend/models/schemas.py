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