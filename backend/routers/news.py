from fastapi import APIRouter
import psycopg2.extras
from database import get_db_connection
from models.schemas import NewsInput

router = APIRouter(prefix="/api")

@router.get("/news")
async def get_news():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM news ORDER BY id ASC")
    res = cur.fetchall()
    conn.close()
    return {"status": "success", "news": res}

@router.put("/news/{id}")
async def update_news(id: int, n: NewsInput):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE news SET tag=%s, title=%s, description=%s, image_url=%s WHERE id=%s", 
                (n.tag, n.title, n.description, n.image_url, id))
    conn.commit()
    conn.close()
    return {"status": "success"}