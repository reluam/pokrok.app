--[[
	PowerUpSpawner.lua (ModuleScript v ServerScriptService)
	Po zničení bedny s jistou šancí spawnuje power-up.
	Typy: ExtraBomb, FlameRange, Speed, FunnyHead, Confusion (funny).
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))
local GridUtils = require(ReplicatedStorage:WaitForChild("GridUtils"))

local PowerUpSpawner = {}
local activePowerUps = {}  -- [cellKey] = { part = Part, type = string }

local function randomType()
	local types = GameConfig.POWERUP_TYPES
	return types[math.random(1, #types)]
end

function PowerUpSpawner.trySpawnAt(cellKey, worldPosition)
	if math.random() > GameConfig.POWERUP_SPAWN_CHANCE then return end
	local typ = randomType()

	local part = Instance.new("Part")
	part.Name = "PowerUp_" .. typ
	part.Size = Vector3.new(2, 1, 2)
	part.Position = worldPosition + Vector3.new(0, part.Size.Y/2, 0)
	part.Anchored = false
	part.CanCollide = true
	part.Material = Enum.Material.Neon
	if typ == "ExtraBomb" then part.Color = Color3.fromRGB(255, 200, 100)
	elseif typ == "FlameRange" then part.Color = Color3.fromRGB(255, 100, 100)
	elseif typ == "Speed" then part.Color = Color3.fromRGB(100, 255, 150)
	elseif typ == "FunnyHead" then part.Color = Color3.fromRGB(255, 100, 255)  -- funny
	else part.Color = Color3.fromRGB(200, 100, 255) end
	part.Parent = workspace

	activePowerUps[cellKey] = { part = part, type = typ }
	part.Touched:Connect(function(hit)
		local character = hit.Parent
		local humanoid = character and character:FindFirstChild("Humanoid")
		local player = humanoid and game.Players:GetPlayerFromCharacter(character)
		if not player then return end
		-- Aplikuj power-up (můžeš rozšířit o hodnoty u hráče v GameManager)
		part:Destroy()
		activePowerUps[cellKey] = nil
		-- Zde můžeš FireClient poslat typ na klienta pro vizuál, a server uložit do player attributes
		player:SetAttribute("LastPowerUp", typ)
		player:SetAttribute("LastPowerUpTime", tick())
	end)
end

return PowerUpSpawner
