--[[
	ArenaManager.lua (ModuleScript v ServerScriptService)
	Vytvoření / reference na arénu, spawny, zničitelné bloky.
	V Roblox Studiu můžeš arénu postavit ručně – pak jen vrací reference.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))
local GridUtils = require(ReplicatedStorage:WaitForChild("GridUtils"))

local CELL = GameConfig.CELL_SIZE
local ARENA_SIZE = GameConfig.ARENA_SIZE
local CENTER = GridUtils.ARENA_CENTER

local ArenaManager = {}
ArenaManager.DestructibleParts = {}  -- [cellKey] = Part
ArenaManager.SpawnCells = {}         -- { {row, col}, ... } – volné spawn pozice

-- Vytvoří jednoduchou arénu z jedné velké podlahy + okrajové zdi (volitelné)
function ArenaManager.createArena(parent)
	parent = parent or workspace

	-- Podlaha
	local floor = Instance.new("Part")
	floor.Name = "ArenaFloor"
	floor.Size = Vector3.new(ARENA_SIZE * CELL + CELL * 2, 1, ARENA_SIZE * CELL + CELL * 2)
	floor.Position = CENTER
	floor.Anchored = true
	floor.Material = Enum.Material.Grass
	floor.Color = Color3.fromRGB(60, 120, 60)
	floor.Parent = parent

	-- Spawn rohy (2–8 hráčů) – rozestupy po obvodu
	local half = math.floor(ARENA_SIZE / 2)
	ArenaManager.SpawnCells = {
		{2, 2}, {2, ARENA_SIZE - 1},
		{ARENA_SIZE - 1, 2}, {ARENA_SIZE - 1, ARENA_SIZE - 1},
		{2, half + 1}, {ARENA_SIZE - 1, half + 1},
		{half + 1, 2}, {half + 1, ARENA_SIZE - 1},
	}

	-- Vygeneruj zničitelné bedny (vnitřek mřížky, kromě spawnů a středu)
	local spawnSet = {}
	for _, s in ipairs(ArenaManager.SpawnCells) do
		spawnSet[GridUtils.cellKey(s[1], s[2])] = true
	end
	local centerKey = GridUtils.cellKey(half + 1, half + 1)
	spawnSet[centerKey] = true

	for row = 2, ARENA_SIZE - 1 do
		for col = 2, ARENA_SIZE - 1 do
			local key = GridUtils.cellKey(row, col)
			if not spawnSet[key] and math.random() < 0.65 then
				local part = Instance.new("Part")
				part.Name = "Crate_" .. key
				part.Size = Vector3.new(CELL * 0.9, CELL * 0.9, CELL * 0.9)
				part.Position = GridUtils.cellToWorld(row, col) + Vector3.new(0, part.Size.Y/2, 0)
				part.Anchored = true
				part.Material = Enum.Material.Wood
				part.Color = Color3.fromRGB(140, 90, 60)
				part.Parent = parent
				ArenaManager.DestructibleParts[key] = part
			end
		end
	end

	return floor
end

function ArenaManager.getSpawnWorldPosition(index)
	local cells = ArenaManager.SpawnCells
	local i = ((index - 1) % #cells) + 1
	local row, col = cells[i][1], cells[i][2]
	return GridUtils.cellToWorld(row, col)
end

function ArenaManager.destroyCrate(cellKey)
	local part = ArenaManager.DestructibleParts[cellKey]
	if part and part.Parent then
		part:Destroy()
		ArenaManager.DestructibleParts[cellKey] = nil
		return true
	end
	return false
end

return ArenaManager
