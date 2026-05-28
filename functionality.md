# Mixter - Functionaliteiten Overzicht

Dit document bevat een opsomming van de huidige functionaliteiten van de Mixter muziekbingo applicatie, onderverdeeld in de Backend en de UI (Frontend).

## 🧠 Backend Functionaliteiten (Python/FastAPI)

### Kamerbeheer (Room Management)
*   **Kamer Aanmaken**: Genereert een unieke 4-cijferige kamercode.
*   **Kamer Status**: Houdt de status van een kamer bij (wie is er gejoind, is het spel gestart/beëindigd).
*   **Speler Management**: Ondersteunt het joinen van spelers met een unieke ID en naam.
*   **In-Memory Opslag**: Gebruikt een snelle in-memory database (`memory_db.py`) voor actieve sessies.

### Muziek & Data
*   **Spotify Playlist Scraper**: Haalt automatisch track-informatie (titel/artiest) op van publieke Spotify playlists.
*   **Deezer Verrijking**: Koppelt Spotify tracks aan Deezer metadata voor:
    *   30-seconden audio previews (MP3).
    *   Album covers (thumbnails).
    *   Release-jaartallen (voor de bingo kaarten).
*   **Track Pooling**: Verzamelt alle nummers van alle spelers en verdeelt deze eerlijk over de spelronde.

### Game Engine
*   **Game Logic**: Bepaalt de volgorde van nummers.
*   **Lazy Loading**: De API stuurt niet alleen het huidige nummer, maar geeft ook alvast een 'peek' naar het volgende nummer voor een naadloze ervaring (pre-buffering).
*   **Synchronisatie**: Zorgt dat alle spelers in dezelfde kamer naar hetzelfde nummer kijken/luisteren.

---

## 🎨 UI Functionaliteiten (React/TypeScript/Tailwind)

### Gebruikerservaring (UX)
*   **Modern Design**: Een 'Dark Mode' interface met een indigo/slate kleurthema.
*   **Responsive Layout**: Werkt op zowel desktop als mobiele apparaten.
*   **Animaties**: Gebruik van `framer-motion` (of CSS transitions) voor vloeiende overgangen in de lobby en het spel.
*   **Toasts**: Real-time notificaties voor succes (bijv. "Playlist geüpload") en fouten (bijv. "Kamer niet gevonden").

### Pagina's & Flows
*   **Home Pagina**:
    *   Invoeren van kamercode om direct te joinen.
    *   "Sessie Aanmaken" knop voor hosts.
    *   **Recente Sessies**: Onthoudt lokaal (localStorage) welke kamers je onlangs hebt bezocht voor snelle her-join.
*   **Lobby Pagina**:
    *   Live lijst van spelers die de kamer binnenkomen.
    *   Host-specifieke controls (Start Game knop).
    *   Real-time polling om te zien of de host het spel al heeft gestart.
*   **Playlist Upload**:
    *   Mogelijkheid om meerdere Spotify URL's toe te voegen voordat je de lobby betreedt.
    *   Dynamische invoervelden (toevoegen/verwijderen van links).
*   **Game Pagina** (in ontwikkeling/basis):
    *   Interface voor het tonen van het huidige spelende nummer.
    *   Visualisatie van de voortgang van het spel.

---

## 🚀 Infrastructuur & Veiligheid
*   **CORS Support**: Geconfigureerd om veilig te communiceren tussen verschillende domeinen (bijv. op Render.com).
*   **Omgevingsvariabelen**: Gebruik van `VITE_API_URL` en `PORT` voor flexibele deployment.
