from fastapi import APIRouter
from .game_routes import router as game_router
from .room_routes import router as room_router

api_router = APIRouter()

api_router.include_router(game_router)
api_router.include_router(room_router)
