from fastapi import APIRouter

router = APIRouter(prefix="/api/community")

@router.get("/posts")
async def get_community_posts():
    return {"status": "success", "posts": []}