from pydantic import BaseModel


from typing import Any, Optional

class Track(BaseModel):
    titel: str
    artist: str

class Player(BaseModel):
    id: str
    name: str
    added_songs: list[Track] = []

class GameTrack(BaseModel):
    track: Track
    added_by: list[str]

class Room(BaseModel):
    code: str
    joined_players: dict[str, Player] = {}
    isStarted: bool = False
    isFinished: bool = False
    track_pool: list[GameTrack] = []
    current_track: Optional[Any] = None


class JoinRoomRequest(BaseModel):
    code: str
    player_id: str
    name: str

class UploadPlaylistRequest(BaseModel):
    code: str
    player_id: str
    url: str
