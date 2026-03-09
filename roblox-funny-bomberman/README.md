# 🧨 Funny Bomberman – Roblox (2–8 hráčů)

Multiplayer Bomberman v Robloxu s vtipnými efekty a power-upy pro 2–8 hráčů.

## Co potřebuješ

- **Roblox Studio** (zdarma z [roblox.com/create](https://create.roblox.com))
- Tento repozitář – skripty zkopíruješ do Studia

## Nastavení v Roblox Studiu

### 1. Nový projekt

1. Otevři Roblox Studio → New → Baseplate (nebo Empty).
2. Ulož projekt (File → Save to Roblox As / Save to File).

### 2. Struktura ve Workspace / ReplicatedStorage

V **ReplicatedStorage** vytvoř:

```
ReplicatedStorage
├── GameConfig (ModuleScript)
├── GridUtils (ModuleScript)
└── Remotes (Folder)
    ├── PlaceBomb (RemoteEvent)
    ├── GameState (RemoteEvent)
    └── PlayerHit (RemoteEvent)
```

V **ServerScriptService** vytvoř:

```
ServerScriptService
├── GameManager (Script)        ← hlavní server script
├── BombHandler (ModuleScript)
├── ArenaManager (ModuleScript)
└── PowerUpSpawner (ModuleScript)
```

**Důležité:** Aby se BombHandler načetl a zapnul poslouchání PlaceBomb, musí ho nějaký běžný Script na serveru jednou načíst (`require`). To dělá GameManager – ten na začátku načte BombHandler, takže pořadí spuštění nech na GameManager jako první (nebo jiný Script, který require(BombHandler)).

V **StarterPlayer** → **StarterPlayerScripts**:

```
StarterPlayerScripts
├── PlayerController (LocalScript)   ← ovládání + bomby
└── GameUI (LocalScript)            ← UI (počet bomb, životy, kolo)
```

V **StarterGui** (nebo v GameUI):

- **ScreenGui** s texty/labely pro: životy, bomby, „Waiting for players“, „You won!“, „You got boomed!“

### 3. Zkopírování kódu

- Otevři každý soubor z `src/` v tomto repozitáři.
- Zkopíruj obsah do příslušného Script/ModuleScript v Roblox Studiu (název musí sedět: GameConfig → GameConfig, atd.).

### 4. Arena (herní plocha)

- **Arena** může být jedna velká **Part** (např. 50×50) nebo mřížka dlaždic.
- V **GameConfig** nastav `ARENA_SIZE`, `CELL_SIZE` a spawn pozice podle tvé arény.
- Spawn pozice hráčů: přidej do Workspace **SpawnLocation** nebo **Model** s částmi, a v **GameManager** je použij (nebo vygeneruj z mřížky).

### 5. Testování

- Play → vyber 2–8 hráčů v **Test** tab (Players) a spusť hru.
- Ovládání: WASD, mezerník = položit bombu.

---

## Herní mechaniky

- **Pohyb**: WASD po mřížce (nebo plynulý pohyb s „snap“ na mřížku).
- **Bomba**: mezerník – položí bombu pod hráče, po X sekundách vybuchne.
- **Výbuch**: kříž (nahoře, dole, vlevo, vpravo) – ničí zničitelné bloky a eliminuje hráče.
- **Power-upy** (po zničení beden): víc bomb, delší plamen, rychlejší pohyb, „funny“ (např. obří hlava, zpomalení ostatních).
- **Kolo**: poslední přeživší vyhrává kolo; po N výhrách vyhrává celou hru.

---

## Struktura souborů v tomto repozitáři

```
roblox-funny-bomberman/
├── README.md
└── src/
    ├── shared/
    │   ├── GameConfig.lua
    │   └── GridUtils.lua
    ├── server/
    │   ├── GameManager.lua
    │   ├── BombHandler.lua
    │   ├── ArenaManager.lua
    │   └── PowerUpSpawner.lua
    └── client/
        ├── PlayerController.lua
        └── GameUI.lua
```

Po zkopírování a nastavení Remotes/Arena by hra měla jít spustit a hrát. Pro „funny“ efekt přidej vlastní zvuky, částicové efekty a vtipné power-upy podle chuti.
