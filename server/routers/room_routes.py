from fastapi import APIRouter
from models.models import JoinRoomRequest, UploadPlaylistRequest

from storage.memory_db import (
    create_room,
    get_room_status,
    add_playlist_to_player,
    join_room,
)

from clients.spotify_client import scrape_playlist

# Create rooms, join rooms, upload playlists
router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("/")
async def list_rooms():
    return {"rooms": []}


@router.post("/create", status_code=201)
async def create_room_endpoint():
    room = await create_room()
    return {"Status": "Kamer aangemaakt", "room": room}


@router.post("/join")
async def join_room_endpoint(payload: JoinRoomRequest):
    room = await join_room(payload)
    return {"status": "Succesvol gejoined", "room": room}


@router.get("/{code}")
async def get_room_endpoint(code: str):
    room = await get_room_status(code)
    return room


@router.post("/playlist")
async def upload_playlist(payload: UploadPlaylistRequest) -> dict:
    scraped_tracks = await scrape_playlist(payload.url)
    await add_playlist_to_player(data=payload, tracks=scraped_tracks)

    return {
        "status": "Playlist succesvol geüpload!",
        "total_songs": len(scraped_tracks),
    }
