import httpx


class DeezerClient:
    BASE_URL = "https://api.deezer.com"

    async def search_track_metadata(self, title: str, artist: str) -> dict:
        """
        Zoekt een nummer op Deezer en geeft de metadata (preview, hoes, jaartal) terug.
        """
        # Standaard (lege) fallback data als we niks kunnen vinden
        result = {
            "track_id": None,
            "album_cover_medium": None,
            "preview_audio_url": None,
            "year": "Onbekend",
        }

        # We openen een asynchrone httpx sessie
        async with httpx.AsyncClient() as client:
            try:
                # --- STAP 1: ZOEKEN NAAR HET NUMMER ---
                # We gebruiken eerst de geavanceerde, strikte zoekmethode van Deezer
                query = f'track:"{title}" artist:"{artist}"'
                search_response = await client.get(
                    f"{self.BASE_URL}/search", params={"q": query}
                )
                search_data = search_response.json()
                tracks = search_data.get("data", [])

                # Fallback: Soms voegt Spotify "(Remastered 2009)" toe, waardoor
                # de strikte zoekopdracht faalt. Dan proberen we het losjes:
                if not tracks:
                    loose_query = f"{title} {artist}"
                    search_response = await client.get(
                        f"{self.BASE_URL}/search", params={"q": loose_query}
                    )
                    search_data = search_response.json()
                    tracks = search_data.get("data", [])

                # Als we nog steeds niks hebben, geef de lege fallback data terug
                if not tracks:
                    return result

                # We hebben een hit! Pak het allerbeste resultaat (de eerste)
                best_match = tracks[0]
                result["track_id"] = best_match["id"]
                result["album_cover_medium"] = best_match["album"]["cover_medium"]
                result["preview_audio_url"] = best_match["preview"]

                # --- STAP 2: JAARTAL OPHALEN ---
                # Nu we het Deezer-ID weten, vragen we de track-details op voor de release date
                track_response = await client.get(
                    f"{self.BASE_URL}/track/{best_match['id']}"
                )

                if track_response.status_code == 200:
                    track_data = track_response.json()
                    release_date = track_data.get("release_date", "")

                    if release_date:
                        # Deezer geeft het format "1969-01-01". We knippen alles na het streepje af.
                        result["year"] = release_date.split("-")[0]

            except Exception as e:
                # Als je internet wegvalt of de API plat ligt, laten we het spel
                # niet crashen, maar geven we gewoon nummers zonder audio/plaatje door.
                print(f"Deezer fout bij {title} - {artist}: {str(e)}")

            return result


# We maken onderaan direct een instantie aan die de rest van je app kan importeren!
deezer_client = DeezerClient()
