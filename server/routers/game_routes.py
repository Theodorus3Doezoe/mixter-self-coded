from fastapi import APIRouter, HTTPException
from storage.memory_db import activate_room_game, get_next_game_track, get_room_status
from clients.deezer_client import deezer_client  # Jouw Deezer API client module
from models.models import GameTrack

router = APIRouter(prefix="/game", tags=["Game"])


async def _enrich_with_deezer(game_track: GameTrack | None) -> dict | None:
    """
    Helper-functie om een kale GameTrack te verrijken met Deezer data.
    Als er geen track is (bijv. aan het einde van de pool), geeft hij direct None terug.
    """
    if not game_track:
        return None

    # We zoeken op Deezer naar de combinatie van titel en artiest
    deezer_data = await deezer_client.search_track_metadata(
        title=game_track.track.titel, artist=game_track.track.artist
    )

    # We bouwen een verrijkt JSON-pakketje op voor de frontend
    return {
        "titel": game_track.track.titel,
        "artist": game_track.track.artist,
        "added_by": game_track.added_by,  # De lijst met schuldigen!
        "media": {
            "thumbnail": deezer_data.get("album_cover_medium"),  # De albumhoes
            "preview_url": deezer_data.get("preview_audio_url"),  # De 30-sec MP3 link
            "release_year": deezer_data.get("year"),  # Het jaartal voor de bingo
            "deezer_id": deezer_data.get("track_id"),  # Handig als backup
        },
    }


@router.post("/start/{code}")
async def start_game_endpoint(code: str):
    await activate_room_game(code)
    return {"status": "Game succesvol gestart!"}


@router.post("/next-track/{code}")
async def next_track_endpoint(code: str) -> dict:
    """
    Endpoint voor de host om de speelwachtrij lazily vooruit te duwen.
    Stuurt het huidige nummer én het volgende nummer VOLLEDIG verrijkt met Deezer media terug.
    """
    room = await get_room_status(code)

    try:
        # 1. Haal de tracks op uit de database-laag
        result = await get_next_game_track(code)

        # 2. Verrijk het huidige spelende nummer met Deezer-data
        current_enriched = await _enrich_with_deezer(result["current_track"])

        # 3. Verrijk alvast de preview van het VOLGENDE nummer (Lazy Loading!)
        next_enriched = await _enrich_with_deezer(result["next_track_preview"])

        # Update room state voor synchronisatie
        room.current_track = current_enriched

        # 4. Smijt de complete, rijke goudmijn aan data naar de frontend
        return {
            "status": "Track succesvol opgehaald en verrijkt",
            "current": current_enriched,
            "next_preview": next_enriched,
        }
    except HTTPException as e:
        if "leeg" in str(e.detail):
            room.isFinished = True
            room.current_track = None
            return {"status": "finished", "message": "Game finished"}
        raise e
