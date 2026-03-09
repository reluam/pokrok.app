--[[
	GameConfig.lua (ModuleScript v ReplicatedStorage)
	Konfigurace Funny Bomberman – 2–8 hráčů
]]

local GameConfig = {}

-- Arena
GameConfig.ARENA_SIZE = 13          -- 13x13 mřížka (liché kvůli středu)
GameConfig.CELL_SIZE = 4           -- velikost jedné buňky v studech
GameConfig.MIN_PLAYERS = 2
GameConfig.MAX_PLAYERS = 8

-- Bomby
GameConfig.BOMB_FUSE_TIME = 2.5   -- sekundy do výbuchu
GameConfig.EXPLOSION_RANGE = 2    -- počet buněk na každou stranu (kříž)
GameConfig.MAX_BOMBS_PER_PLAYER = 3
GameConfig.EXPLOSION_DURATION = 0.6  -- jak dlouho trvá vizuál výbuchu

-- Hráč
GameConfig.PLAYER_WALK_SPEED = 14
GameConfig.PLAYER_JUMP_POWER = 0     -- žádné skákání = čistý bomberman
GameConfig.LIVES_PER_ROUND = 1       -- 1 život na kolo (klasika)
GameConfig.ROUNDS_TO_WIN = 3         -- kolik kol vyhrát pro celkové vítězství

-- Power-upy (funny)
GameConfig.POWERUP_SPAWN_CHANCE = 0.6  -- šance že z bedny vypadne power-up
GameConfig.POWERUP_TYPES = {
	"ExtraBomb",      -- +1 max bomba
	"FlameRange",     -- +1 dosah plamene
	"Speed",          -- rychlejší pohyb
	"FunnyHead",      -- obří hlava (vtipný model)
	"Confusion",      -- u ostatních na chvíli přehodí ovládání
}

-- Časy (sekundy)
GameConfig.LOBBY_WAIT_TIME = 15      -- čekání na hráče v lobby
GameConfig.ROUND_END_DELAY = 4       -- po skončení kola před dalším
GameConfig.RESPAWN_INVINCIBILITY = 2 -- (pro budoucí rozšíření)

return GameConfig
