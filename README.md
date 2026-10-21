# Spades Tutorial Playable

Browser prototype of the guided Spades tutorial as a **full 13-trick hand**. **English UI only.** No Unity build required.

## Open

From this folder:

```bash
cd tutorial-playable
python3 -m http.server 8765
```

Then open [http://localhost:8765](http://localhost:8765).

Or open `index.html` directly in a browser (file:// works for local asset copies).

## Flow

1. Intro (teams) → contract (team bid **4**, score target **+40**)
2. West leads; hands from `SeedsHandler.TutorialSeed`
3. Teaching tips embedded while you play (follow suit, trump, lead)
4. HUD always shows **Team tricks: X / 4**; brief flash who won each trick
5. At 4 tricks → contract made (+40); keep playing remaining tricks
6. Overtricks show as bags (+1); hand ends after trick 13 with score summary

## Edit copy

All player-facing strings are in [`copy.js`](copy.js). Change text → save → reload.

## Assets

Copied from the Unity game (no rebuild needed):

- `assets/cards/*.png` — classic card faces from `Fronts_New_4/0` (Unity sprites)
- `assets/card_back.png` — default back from `Resources/Backs_New_4/1.png`
- `assets/table.png` — felt from `Resources/Tables_New_4/1.png`
- `assets/avatar_*.png` — seat avatars from `Resources/Avatars/`
- popup / buttons / hint panel from game UI textures

Filenames use Unity convention: rank+suit (`AS.png`, `TS.png` for ten of spades).
