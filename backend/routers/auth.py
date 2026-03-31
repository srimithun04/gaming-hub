from fastapi import APIRouter
from database import get_db_connection

router = APIRouter()

@router.post("/login")
async def login(user: dict):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT password_hash FROM users WHERE username = %s", (user.get('username'),))
    res = cur.fetchone()
    conn.close()
    
    if res and res[0] == user.get('password'):
        return {"status": "success", "role": "admin" if user.get('username') == "admin" else "user"}
    return {"status": "error", "message": "Invalid credentials"}

@router.post("/signup")
async def signup(user: dict):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
            (user.get('username'), user.get('email'), user.get('password'))
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success", "message": "Gamer profile created! Welcome to the Hub."}
    except Exception as e:
        return {"status": "error", "message": "Username or Email already exists."}