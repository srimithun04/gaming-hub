from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import psycopg2.extras
import json # Used to handle the JSON string for crop data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "host": "localhost",
    "database": "gaming-hub",
    "user": "srimithun",
    "password": "srimithun123", 
    "port": "5432"
}

class UserAuth(BaseModel):
    username: str
    password: str
    email: str = None 

# UPDATED: The Pydantic model now includes an optional crop_data string
class GameInput(BaseModel):
    title: str
    genre: str
    image_url: str
    crop_data: str = None # NEW: The serialized JSON coordinates

@app.post("/signup")
async def signup(user: UserAuth):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
            (user.username, user.email, user.password)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": "Gamer profile created! Welcome to the Hub."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
async def login(user: UserAuth):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT password_hash FROM users WHERE username = %s", (user.username,))
        result = cur.fetchone()
        conn.close()
        
        if result and result[0] == user.password:
            role = "admin" if user.username == "admin" else "user"
            return {"status": "success", "message": "Access Granted.", "role": role}
            
        return {"status": "error", "message": "Invalid username or password"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# UPDATED: Fetches all game data, including the new crop_data string
@app.get("/api/top-games")
async def get_top_games():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # We rename image_url as image for easier frontend integration
        # NEW: Added crop_data to the SELECT list
        cur.execute("SELECT id, title, genre, image_url as image, crop_data FROM games ORDER BY id DESC")
        games = cur.fetchall()
        conn.close()
        return {"status": "success", "games": games}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ADMIN ROUTES ---

# UPDATED: Now saves the new crop_data string during game creation
@app.post("/api/games")
async def add_game(game: GameInput):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO games (title, genre, image_url, crop_data) VALUES (%s, %s, %s, %s)",
            (game.title, game.genre, game.image_url, game.crop_data)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": "Game added to the database!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# NEW: The "Edit Game" (PUT) order. This updates all fields for a specific game id.
@app.put("/api/games/{game_id}")
async def update_game(game_id: int, game: GameInput):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        # This SQL UPDATES the game matching the specified id
        cur.execute(
            "UPDATE games SET title = %s, genre = %s, image_url = %s, crop_data = %s WHERE id = %s",
            (game.title, game.genre, game.image_url, game.crop_data, game_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": "Game updated successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/games/{game_id}")
async def delete_game(game_id: int):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("DELETE FROM games WHERE id = %s", (game_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": "Game deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))