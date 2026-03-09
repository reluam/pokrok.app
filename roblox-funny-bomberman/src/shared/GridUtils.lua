--[[
	GridUtils.lua (ModuleScript v ReplicatedStorage)
	Převod světových souřadnic ↔ mřížkové buňky (grid cell).
]]

local GameConfig = require(script.Parent:WaitForChild("GameConfig"))
local CELL = GameConfig.CELL_SIZE
local ARENA_SIZE = GameConfig.ARENA_SIZE

local GridUtils = {}

-- Střed arény ve světových souřadnicích (nastav podle své arény ve Studiu)
GridUtils.ARENA_CENTER = Vector3.new(0, 1, 0)

-- World position → grid cell (x, z jako index 1..ARENA_SIZE)
function GridUtils.worldToCell(worldPos)
	local center = GridUtils.ARENA_CENTER
	local rx = (worldPos.X - center.X) / CELL
	local rz = (worldPos.Z - center.Z) / CELL
	local col = math.floor(rx + 0.5) + math.floor(ARENA_SIZE / 2) + 1
	local row = math.floor(rz + 0.5) + math.floor(ARENA_SIZE / 2) + 1
	col = math.clamp(col, 1, ARENA_SIZE)
	row = math.clamp(row, 1, ARENA_SIZE)
	return row, col
end

-- Grid cell (row, col) → world position (střed buňky, Y = arena Y)
function GridUtils.cellToWorld(row, col)
	local center = GridUtils.ARENA_CENTER
	local half = math.floor(ARENA_SIZE / 2)
	local x = (col - 1 - half) * CELL + center.X
	local z = (row - 1 - half) * CELL + center.Z
	return Vector3.new(x, center.Y, z)
end

-- Je buňka uvnitř arény?
function GridUtils.isInBounds(row, col)
	return row >= 1 and row <= ARENA_SIZE and col >= 1 and col <= ARENA_SIZE
end

-- Vrací klíč buňky pro tabulky (např. "5,7")
function GridUtils.cellKey(row, col)
	return row .. "," .. col
end

return GridUtils
