from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import psycopg2.extras

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DB_CONFIG = {"host": "localhost", "database": "gaming-hub", "user": "srimithun", "password": "srimithun123", "port": "5432"}

class GameInput(BaseModel):
    title: str; genre: str; image_url: str; crop_data: str = None 

class NewsInput(BaseModel):
    tag: str; title: str; description: str; image_url: str

class AssetInput(BaseModel):
    image_url: str

# --- AUTH ---
@app.post("/login")
async def login(user: dict):
    conn = psycopg2.connect(**DB_CONFIG); cur = conn.cursor()
    cur.execute("SELECT password_hash FROM users WHERE username = %s", (user['username'],))
    res = cur.fetchone(); conn.close()
    if res and res[0] == user['password']:
        return {"status": "success", "role": "admin" if user['username'] == "admin" else "user"}
    return {"status": "error", "message": "Invalid credentials"}

#signup--
@app.post("/signup")
async def signup(user: dict):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
            (user['username'], user['email'], user['password'])
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": "Gamer profile created! Welcome to the Hub."}
    except Exception as e:
        return {"status": "error", "message": "Username or Email already exists."}
# --- GAMES --- 
@app.get("/api/top-games")
async def get_games():
    conn = psycopg2.connect(**DB_CONFIG); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, title, genre, image_url as image, crop_data FROM games ORDER BY id DESC")
    res = cur.fetchall(); conn.close(); return {"status": "success", "games": res}

@app.post("/api/games")
async def add_game(g: GameInput):
    conn = psycopg2.connect(**DB_CONFIG); cur = conn.cursor()
    cur.execute("INSERT INTO games (title, genre, image_url, crop_data) VALUES (%s,%s,%s,%s)", (g.title, g.genre, g.image_url, g.crop_data))
    conn.commit(); conn.close(); return {"status": "success"}

# THESE ARE THE TWO MISSING ROUTES!
@app.put("/api/games/{game_id}")
async def update_game(game_id: int, g: GameInput):
    conn = psycopg2.connect(**DB_CONFIG); cur = conn.cursor()
    cur.execute("UPDATE games SET title=%s, genre=%s, image_url=%s, crop_data=%s WHERE id=%s", (g.title, g.genre, g.image_url, g.crop_data, game_id))
    conn.commit(); conn.close(); return {"status": "success"}

@app.delete("/api/games/{game_id}")
async def delete_game(game_id: int):
    conn = psycopg2.connect(**DB_CONFIG); cur = conn.cursor()
    cur.execute("DELETE FROM games WHERE id=%s", (game_id,))
    conn.commit(); conn.close(); return {"status": "success"}

# --- NEWS ---
@app.get("/api/news")
async def get_news():
    conn = psycopg2.connect(**DB_CONFIG); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM news ORDER BY id ASC")
    res = cur.fetchall(); conn.close(); return {"status": "success", "news": res}

@app.put("/api/news/{id}")
async def update_news(id: int, n: NewsInput):
    conn = psycopg2.connect(**DB_CONFIG); cur = conn.cursor()
    cur.execute("UPDATE news SET tag=%s, title=%s, description=%s, image_url=%s WHERE id=%s", (n.tag, n.title, n.description, n.image_url, id))
    conn.commit(); conn.close(); return {"status": "success"}

# --- ASSETS (Banners) ---
@app.get("/api/assets")
async def get_assets():
    conn = psycopg2.connect(**DB_CONFIG); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT asset_key, image_url FROM site_assets")
    res = {row['asset_key']: row['image_url'] for row in cur.fetchall()}
    conn.close(); return {"status": "success", "assets": res}

@app.put("/api/assets/{key}")
async def update_asset(key: str, a: AssetInput):
    conn = psycopg2.connect(**DB_CONFIG); cur = conn.cursor()
    cur.execute("UPDATE site_assets SET image_url=%s WHERE asset_key=%s", (a.image_url, key))
    conn.commit(); conn.close(); return {"status": "success"}