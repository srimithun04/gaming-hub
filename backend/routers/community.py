from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2.extras
from database import get_db_connection
from models.schemas import PostInput, MessageInput

# --- NEW SCHEMA FOR COMMENTS ---
class CommentInput(BaseModel):
    username: str
    content: str

router = APIRouter(prefix="/api/community")

# --- NEW ROUTE: Search for users (Updated to hide admin) ---
@router.get("/users/search")
async def search_users(q: str, current_user: str):
    if not q:
        return {"status": "success", "users": []}
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # We added: AND username != 'admin' 
        cur.execute(
            "SELECT username FROM users WHERE username ILIKE %s AND username != %s AND username != 'admin' LIMIT 5",
            (f"%{q}%", current_user)
        )
        res = cur.fetchall()
        conn.close()
        return {"status": "success", "users": res}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- NEW ROUTE: Fetch a specific conversation ---
@router.get("/messages")
async def get_messages(user1: str, user2: str):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Automatically mark messages as read when the user opens the chat
        cur.execute("""
            UPDATE direct_messages 
            SET is_read = TRUE 
            WHERE receiver_username = %s AND sender_username = %s AND is_read = FALSE
        """, (user1, user2))
        conn.commit() # Save the "read" status
        
        # Now fetch the conversation as normal
        cur.execute("""
            SELECT * FROM direct_messages 
            WHERE (sender_username = %s AND receiver_username = %s)
               OR (sender_username = %s AND receiver_username = %s)
            ORDER BY created_at ASC
        """, (user1, user2, user2, user1))
        res = cur.fetchall()
        return {"status": "success", "messages": res}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()

# --- NEW ROUTE: Send a message ---
@router.post("/messages")
async def send_message(msg: MessageInput):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO direct_messages (sender_username, receiver_username, content) VALUES (%s, %s, %s)",
            (msg.sender, msg.receiver, msg.content)
        )
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- NEW ROUTE: Fetch Inbox (Recent Chats) ---
@router.get("/inbox/{username}")
async def get_inbox(username: str):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("""
            SELECT 
              CASE WHEN sender_username = %s THEN receiver_username ELSE sender_username END as name,
              MAX(created_at) as last_msg_time,
              SUM(CASE WHEN receiver_username = %s AND is_read = FALSE THEN 1 ELSE 0 END) as unread_count
            FROM direct_messages
            WHERE sender_username = %s OR receiver_username = %s
            GROUP BY name
            ORDER BY last_msg_time DESC
        """, (username, username, username, username))
        res = cur.fetchall()
        return {"status": "success", "inbox": res}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()

# --- EXISTING ROUTES BELOW ---
# --- UPDATED: Fetch Posts (Now includes comment_count) ---
@router.get("/posts")
async def get_community_posts(current_user: str = ""):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # NEW: Added the comment_count subquery!
        query = """
            SELECT p.*, 
                   (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as gg_count,
                   (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count,
                   EXISTS(SELECT 1 FROM user_follows WHERE follower_username = %s AND following_username = p.username) as is_following
            FROM posts p
            ORDER BY p.created_at DESC
            LIMIT 50
        """
        cur.execute(query, (current_user,))
        res = cur.fetchall()
        return {"status": "success", "posts": res}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()

@router.post("/posts")
async def create_post(post: PostInput):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO posts (username, game_title, content, media_url, media_type) VALUES (%s, %s, %s, %s, %s)",
            (post.username, post.game_title, post.content, post.media_url, post.media_type)
        )
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ==========================================
# 4. USER PROFILE & FOLLOW ENDPOINTS
# ==========================================
@router.get("/profile/{target_user}")
async def get_profile_stats(target_user: str, current_user: str):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get Follower Count
        cur.execute("SELECT COUNT(*) FROM user_follows WHERE following_username = %s", (target_user,))
        followers = cur.fetchone()['count']
        
        # Get Following Count
        cur.execute("SELECT COUNT(*) FROM user_follows WHERE follower_username = %s", (target_user,))
        following = cur.fetchone()['count']
        
        # Get Post Count
        cur.execute("SELECT COUNT(*) FROM posts WHERE username = %s", (target_user,))
        posts_count = cur.fetchone()['count']
        
        # Check if current_user is following target_user
        is_following = False
        if current_user != target_user:
            cur.execute("SELECT 1 FROM user_follows WHERE follower_username = %s AND following_username = %s", (current_user, target_user))
            is_following = bool(cur.fetchone())
            
        return {
            "status": "success", 
            "stats": {
                "followers": followers, 
                "following": following, 
                "posts": posts_count,
                "is_following": is_following
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()

@router.get("/profile/{target_user}/posts")
async def get_user_profile_posts(target_user: str):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # UPDATED: Added the gg_count and comment_count subqueries here too!
        query = """
            SELECT p.*, 
                   (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as gg_count,
                   (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count
            FROM posts p 
            WHERE p.username = %s 
            ORDER BY p.created_at DESC
        """
        cur.execute(query, (target_user,))
        res = cur.fetchall()
        return {"status": "success", "posts": res}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()

@router.post("/profile/{target_user}/follow")
async def toggle_follow(target_user: str, payload: dict): 
    current_user = payload.get("current_user")
    if not current_user or current_user == target_user:
        return {"status": "error", "message": "Invalid request"}
        
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if already following
        cur.execute("SELECT 1 FROM user_follows WHERE follower_username = %s AND following_username = %s", (current_user, target_user))
        if cur.fetchone():
            # Unfollow
            cur.execute("DELETE FROM user_follows WHERE follower_username = %s AND following_username = %s", (current_user, target_user))
            action = "unfollowed"
        else:
            # Follow
            cur.execute("INSERT INTO user_follows (follower_username, following_username) VALUES (%s, %s)", (current_user, target_user))
            action = "followed"
            
        conn.commit()
        return {"status": "success", "action": action}
    except Exception as e:
        if conn:
            conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()

@router.get("/profile/{target_user}/followers")
async def get_followers(target_user: str):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT follower_username as username 
            FROM user_follows 
            WHERE following_username = %s
        """, (target_user,))
        res = cur.fetchall()
        return {"status": "success", "data": res}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()

@router.get("/profile/{target_user}/following")
async def get_following(target_user: str):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT following_username as username 
            FROM user_follows 
            WHERE follower_username = %s
        """, (target_user,))
        res = cur.fetchall()
        return {"status": "success", "data": res}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()

# ==========================================
# 5. POST COMMENTS ENDPOINTS
# ==========================================
@router.get("/posts/{post_id}/comments")
async def get_post_comments(post_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, username, content, created_at 
            FROM post_comments 
            WHERE post_id = %s 
            ORDER BY created_at ASC
        """, (post_id,))
        res = cur.fetchall()
        return {"status": "success", "comments": res}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()

@router.post("/posts/{post_id}/comments")
async def add_post_comment(post_id: int, comment: CommentInput):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO post_comments (post_id, username, content) 
            VALUES (%s, %s, %s)
        """, (post_id, comment.username, comment.content))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        if conn:
            conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        if conn:
            conn.close()