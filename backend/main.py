from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import our modular routers
from routers import auth, games, news, admin, community

app = FastAPI(title="Gaming Hub API")

# Setup CORS
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# Register the routers
app.include_router(auth.router)
app.include_router(games.router)
app.include_router(news.router)
app.include_router(admin.router)
app.include_router(community.router)

# Run this server using: uvicorn main:app --reload