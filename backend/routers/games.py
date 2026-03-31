from fastapi import APIRouter
import psycopg2.extras
from database import get_db_connection
from models.schemas import GameInput

router = APIRouter(prefix="/api")

@router.get("/top-games")
async def get_games():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, title, genre, image_url as image, crop_data FROM games ORDER BY id DESC")
    res = cur.fetchall()
    conn.close()
    return {"status": "success", "games": res}

@router.post("/games")
async def add_game(g: GameInput):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO games (title, genre, image_url, crop_data) VALUES (%s,%s,%s,%s)", 
                (g.title, g.genre, g.image_url, g.crop_data))
    conn.commit()
    conn.close()
    return {"status": "success"}

@router.put("/games/{game_id}")
async def update_game(game_id: int, g: GameInput):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE games SET title=%s, genre=%s, image_url=%s, crop_data=%s WHERE id=%s", 
                (g.title, g.genre, g.image_url, g.crop_data, game_id))
    conn.commit()
    conn.close()
    return {"status": "success"}

@router.delete("/games/{game_id}")
async def delete_game(game_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM games WHERE id=%s", (game_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}