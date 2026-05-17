from fastapi import HTTPException
from models.models import Player, Room, UploadPlaylistRequest, Track
import random
from engine.game_engine import start_game_logic

active_rooms: dict[str, Room] = {}


async def create_room() -> Room:
    if len(active_rooms) >= 10000:
        raise HTTPException(
            status_code=507,
            detail="De server zit vol. Er kunnen momenteel geen nieuwe kamers worden aangemaakt.",
        )

    code = generate_code()
    while code in active_rooms:
        code = generate_code()

    new_room = Room(code=code)

    active_rooms[code] = new_room
    print(f"Current active rooms:{active_rooms}")

    return new_room


def generate_code():
    random_number = random.randint(0, 9999)
    new_key = f"{random_number:04d}"
    return new_key


async def join_room(data) -> Room:
    if data.code not in active_rooms:
        raise HTTPException(status_code=404, detail="Deze kamercode bestaat niet.")

    room = active_rooms[data.code]

    if room.isStarted:
        raise HTTPException(status_code=400, detail="Dit spel is helaas al gestart!")

    new_player = Player(id=data.player_id, name=data.name)
    room.joined_players[new_player.id] = new_player

    return room


async def get_room_status(code: str) -> Room:
    if code not in active_rooms:
        raise HTTPException(
            status_code=404, detail=f"Kamer met code '{code}' is niet gevonden."
        )

    return active_rooms[code]


async def add_playlist_to_player(
    data: UploadPlaylistRequest, tracks: list[Track]
) -> None:
    if data.code not in active_rooms:
        raise HTTPException(status_code=404, detail="Kamer niet gevonden.")

    room = active_rooms[data.code]

    if data.player_id not in room.joined_players:
        raise HTTPException(status_code=404, detail="Speler niet gevonden.")

    room.joined_players[data.player_id].added_songs.extend(tracks)


async def activate_room_game(code: str) -> Room:
    if code not in active_rooms:
        raise HTTPException(status_code=404, detail="Kamer niet gevonden.")

    room = active_rooms[code]

    # Haal de spelers op uit de dictionary als een platte lijst
    players_list = list(room.joined_players.values())

    if not players_list:
        raise HTTPException(
            status_code=400, detail="Je kunt geen spel starten zonder spelers!"
        )

    # Jagen we door de engine heen en vullen de track_pool!
    room.track_pool = start_game_logic(players_list)
    room.isStarted = True

    return room


async def get_next_game_track(code: str) -> dict:
    """
    Trekt het huidige nummer van de stapel en geeft een 'peek'
    van het volgende nummer mee voor lazy loading/pre-buffering.
    """
    if code not in active_rooms:
        raise HTTPException(status_code=404, detail="Kamer niet gevonden.")

    room = active_rooms[code]

    if not room.track_pool:
        raise HTTPException(
            status_code=400,
            detail="De track pool is helemaal leeg! Het spel is afgelopen.",
        )

    # 1. Pop het HUIDIGE nummer (verwijder hem uit de wachtrij zodat hij uniek blijft)
    current_track = room.track_pool.pop(0)

    # 2. Lazy Loading Peek: Kijk of er alvast een VOLGEND nummer klaarlaat
    next_track_preview = None
    if len(room.track_pool) > 0:
        # We gebruiken [0] omdat het vorige nummer net is weggesprongen.
        # We POPPEN hem niet, dus hij blijft netjes op de stapel liggen voor de volgende beurt.
        next_track_preview = room.track_pool[0]

    # 3. Geef beide objecten terug aan de router
    return {"current_track": current_track, "next_track_preview": next_track_preview}
