from fastapi import APIRouter
import psycopg2.extras
from database import get_db_connection
from models.schemas import AssetInput

router = APIRouter(prefix="/api")

@router.get("/assets")
async def get_assets():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT asset_key, image_url FROM site_assets")
    res = {row['asset_key']: row['image_url'] for row in cur.fetchall()}
    conn.close()
    return {"status": "success", "assets": res}

@router.put("/assets/{key}")
async def update_asset(key: str, a: AssetInput):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE site_assets SET image_url=%s WHERE asset_key=%s", (a.image_url, key))
    conn.commit()
    conn.close()
    return {"status": "success"}