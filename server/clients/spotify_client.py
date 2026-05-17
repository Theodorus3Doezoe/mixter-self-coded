from spotify_scraper import SpotifyClient
import asyncio
from models.models import Track


async def scrape_playlist(url: str) -> list[Track]:
    client = SpotifyClient(
        log_level="DEBUG",  # Set logging level
    )

    data = await asyncio.to_thread(client.get_playlist_info, url)
    tracks = data.get("tracks", [])

    scraped_tracks = []

    for i in tracks:
        track_name = i.get("name", "Unknown Track")

        artists = i.get("artists", [])
        if artists:
            artist_name = artists[0].get("name", "Unknown Artist")
        else:
            artist_name = "Unknown Artist"

        new_track = Track(titel=track_name, artist=artist_name)

        scraped_tracks.append(new_track)

    return scraped_tracks
