--[[
	BombHandler.lua (ModuleScript v ServerScriptService)
	Kladení bomb, časovač, výbuch (kříž), poškození hráčů a beden.
]]

local ServerScriptService = game:GetService("ServerScriptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))
local GridUtils = require(ReplicatedStorage:WaitForChild("GridUtils"))
local ArenaManager = require(ServerScriptService:WaitForChild("ArenaManager"))
local PowerUpSpawner = require(ServerScriptService:WaitForChild("PowerUpSpawner"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local PlaceBombRemote = Remotes:WaitForChild("PlaceBomb")
local PlayerHitRemote = Remotes:WaitForChild("PlayerHit")

local CELL = GameConfig.CELL_SIZE
local FUSE = GameConfig.BOMB_FUSE_TIME
local RANGE = GameConfig.EXPLOSION_RANGE

-- [cellKey] = { owner = Player, range = number, at = tick() }
local activeBombs = {}
-- [cellKey] = true (dočasně zablokované po výbuchu)
local explosionBlock = {}

local function cellKey(row, col)
	return GridUtils.cellKey(row, col)
end

local function isCellBlocked(row, col)
	local key = cellKey(row, col)
	if activeBombs[key] or explosionBlock[key] then return true end
	return ArenaManager.DestructibleParts[key] ~= nil
end

-- Vybuchne jedna buňka: poškození hráčů, zničení bedny, šíření plamene
local function explodeCell(row, col, ownerUserId, flameRange, stopSpread)
	local key = cellKey(row, col)
	if not GridUtils.isInBounds(row, col) then return true end

	-- Znič bednu
	local crate = ArenaManager.DestructibleParts[key]
	if crate then
		local worldPos = GridUtils.cellToWorld(row, col)
		ArenaManager.destroyCrate(key)
		PowerUpSpawner.trySpawnAt(key, worldPos)
		return true  -- plamen dál nešíří
	end

	-- Zasažení hráčů v této buňce
	-- SOLO / DEBUG: dočasně NEZABÍJÍME hráče, jen můžeme do budoucna poslat event na klient
	-- aby se daly odladit explozivní efekty bez instantní smrti po spawnování.
	-- Pokud chceš smrt hráče, vrať se k verzi s Humanoid.Health = 0.

	if stopSpread then return false end
	explosionBlock[key] = true
	Debris:AddItem(function() explosionBlock[key] = nil end, GameConfig.EXPLOSION_DURATION + 0.2)
	return false
end

-- Výbuch jedné bomby – kříž
local function explodeBomb(row, col, ownerUserId, flameRange)
	flameRange = flameRange or RANGE
	explodeCell(row, col, ownerUserId, flameRange, false)

	for d = 1, flameRange do
		if explodeCell(row - d, col, ownerUserId, flameRange, false) then break end
	end
	for d = 1, flameRange do
		if explodeCell(row + d, col, ownerUserId, flameRange, false) then break end
	end
	for d = 1, flameRange do
		if explodeCell(row, col - d, ownerUserId, flameRange, false) then break end
	end
	for d = 1, flameRange do
		if explodeCell(row, col + d, ownerUserId, flameRange, false) then break end
	end
end

-- Odpočet a výbuch
local function onBombTick(bombData, row, col)
	activeBombs[cellKey(row, col)] = nil
	explodeBomb(row, col, bombData.owner, bombData.range)
	-- Vizuál výbuchu můžeš řešit přes BindableEvent → client, nebo částice na serveru
end

-- API pro GameManager
local BombHandler = {}

function BombHandler.placeBomb(player, customRange)
	local character = player.Character
	if not character then return false end
	local hrp = character:FindFirstChild("HumanoidRootPart")
	if not hrp then return false end

	local row, col = GridUtils.worldToCell(hrp.Position)
	local key = cellKey(row, col)
	if activeBombs[key] then return false end

	local bombsPlaced = 0
	for k in pairs(activeBombs) do
		if activeBombs[k].owner == player.UserId then
			bombsPlaced = bombsPlaced + 1
		end
	end
	if bombsPlaced >= (customRange and customRange.maxBombs or GameConfig.MAX_BOMBS_PER_PLAYER) then
		return false
	end

	activeBombs[key] = {
		owner = player.UserId,
		range = customRange and customRange.flameRange or GameConfig.EXPLOSION_RANGE,
		at = tick(),
	}
	task.delay(FUSE, function()
		onBombTick(activeBombs[key] or {}, row, col)
	end)
	return true
end

function BombHandler.getActiveBombCount(player)
	local n = 0
	for _, data in pairs(activeBombs) do
		if data.owner == player.UserId then n = n + 1 end
	end
	return n
end

-- Client posílá žádost o položení bomby
PlaceBombRemote.OnServerEvent:Connect(function(player)
	BombHandler.placeBomb(player)
end)

return BombHandler
