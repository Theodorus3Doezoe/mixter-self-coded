import random
from models.models import Player, GameTrack, Track


def start_game_logic(players: list[Player]) -> list[GameTrack]:
    # Stap 1: Ontdubbelen en samenvoegen tot GameTracks
    unique_tracks = _prepare_unique_tracks(players)

    # Stap 2: Slim verdelen over virtuele bakjes (jouw tactiek voor de balans!)
    vrijgezelle_namen = [p.name for p in players]
    hussel_bakjes = _verdeel_voor_husselen(unique_tracks, vrijgezelle_namen)

    # Stap 3: De Batched Shuffle uitvoeren voor de definitieve volgorde
    definitieve_wachtrij = _genereer_eerlijke_wachtrij(hussel_bakjes)

    return definitieve_wachtrij


def _prepare_unique_tracks(players: list[Player]) -> list[GameTrack]:
    unique_tracks_map = {}

    for player in players:
        for track in player.added_songs:  # We gebruiken jouw 'added_songs' veld
            # Unieke sleutel maken om kleine typeverschillen op te vangen
            track_key = f"{track.titel.lower()} | {track.artist.lower()}"

            if track_key not in unique_tracks_map:
                unique_tracks_map[track_key] = GameTrack(
                    track=track, added_by=[player.name]
                )
            else:
                if player.name not in unique_tracks_map[track_key].added_by:
                    unique_tracks_map[track_key].added_by.append(player.name)

    return list(unique_tracks_map.values())


def _verdeel_voor_husselen(
    unique_tracks: list[GameTrack], spelers_namen: list[str]
) -> dict:
    hussel_bakjes = {naam: [] for naam in spelers_namen}

    for game_track in unique_tracks:
        eigenaren = game_track.added_by

        if len(eigenaren) == 1:
            hussel_bakjes[eigenaren[0]].append(game_track)
        else:
            # Slimme check: geef hem aan de eigenaar met de minste nummers op dit moment
            eigenaar_met_minste_nummers = min(
                eigenaren, key=lambda naam: len(hussel_bakjes[naam])
            )
            hussel_bakjes[eigenaar_met_minste_nummers].append(game_track)

    return hussel_bakjes


def _genereer_eerlijke_wachtrij(hussel_bakjes: dict) -> list[GameTrack]:
    definitieve_wachtrij = []

    while any(hussel_bakjes.values()):
        huidige_ronde = []

        for nummers in hussel_bakjes.values():
            if len(nummers) > 0:
                gekozen_nummer = random.choice(nummers)
                huidige_ronde.append(gekozen_nummer)
                nummers.remove(gekozen_nummer)

        random.shuffle(huidige_ronde)
        definitieve_wachtrij.extend(huidige_ronde)

    return definitieve_wachtrij
