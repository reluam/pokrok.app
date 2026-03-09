--[[
	GameManager.lua (Script v ServerScriptService)
	Lobby → kolo → spawn hráčů → čekání na výbuchy → konec kola → vítěz.
	2–8 hráčů, ROUNDS_TO_WIN pro celkové vítězství.
]]

local ServerScriptService = game:GetService("ServerScriptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))
local ArenaManager = require(ServerScriptService:WaitForChild("ArenaManager"))
local BombHandler = require(ServerScriptService:WaitForChild("BombHandler"))

local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local GameStateRemote = Remotes:WaitForChild("GameState")

local MIN = GameConfig.MIN_PLAYERS
local MAX = GameConfig.MAX_PLAYERS
local ROUNDS_TO_WIN = GameConfig.ROUNDS_TO_WIN
local ROUND_END_DELAY = GameConfig.ROUND_END_DELAY
local LOBBY_WAIT = GameConfig.LOBBY_WAIT_TIME

local gameState = "Lobby"  -- Lobby | Playing | RoundEnd
local roundNumber = 0
local scores = {}   -- [userId] = počet vyhraných kol
local alive = {}    -- [userId] = true během kola
local playersInRound = {}

local function broadcastState(state, data)
	data = data or {}
	data.state = state
	data.round = roundNumber
	data.scores = scores
	data.alive = alive
	data.playersInRound = playersInRound
	GameStateRemote:FireAllClients(data)
end

local function resetArena()
	-- Přestav arénu (zničitelné bedny znovu) – zjednodušeně: znovu vytvoř
	-- Pro teď jen zresetujeme stav; pokud používáš ArenaManager.createArena jen na start, můžeš přidat ArenaManager.reset()
end

local function spawnAll()
	for _, userId in ipairs(playersInRound) do
		local player = Players:GetPlayerByUserId(userId)
		if player then
			alive[userId] = true
			player:LoadCharacter()
			local spawnIndex = #playersInRound
			for i, uid in ipairs(playersInRound) do
				if uid == userId then spawnIndex = i break end
			end
			local pos = ArenaManager.getSpawnWorldPosition(spawnIndex)
			if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
				player.Character.HumanoidRootPart.CFrame = CFrame.new(pos)
			end
			player.Character.Humanoid.WalkSpeed = GameConfig.PLAYER_WALK_SPEED
			player.Character.Humanoid.JumpPower = GameConfig.PLAYER_JUMP_POWER
		end
	end
end

local function countAlive()
	local n = 0
	for uid in pairs(alive) do
		if alive[uid] then n = n + 1 end
	end
	return n
end

local function getLastAlive()
	for uid in pairs(alive) do
		if alive[uid] then return uid end
	end
	return nil
end

local function onPlayerHit(player, killerUserId)
	local uid = player.UserId
	if not alive[uid] then return end
	alive[uid] = false
	broadcastState("Playing")
	-- Kontrola konce kola
	task.defer(function()
		local left = countAlive()
		if left <= 1 then
			gameState = "RoundEnd"
			local winner = getLastAlive()
			if winner then
				scores[winner] = (scores[winner] or 0) + 1
			end
			broadcastState("RoundEnd", { winnerUserId = winner })
			task.wait(ROUND_END_DELAY)
			if scores[winner] and scores[winner] >= ROUNDS_TO_WIN then
				broadcastState("GameOver", { winnerUserId = winner })
				gameState = "Lobby"
				roundNumber = 0
				scores = {}
			else
				roundNumber = roundNumber + 1
				gameState = "Playing"
				resetArena()
				spawnAll()
				broadcastState("Playing")
			end
		end
	end)
end

-- Když hráč zemře (Humanoid.Died) – výbuch nastaví Health=0, tady jen reagujeme – považujeme za zásah od někoho (nebo pád)
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(char)
		local humanoid = char:WaitForChild("Humanoid")
		humanoid.Died:Connect(function()
			if gameState == "Playing" and alive[player.UserId] then
				onPlayerHit(player, nil)
			end
		end)
	end)
end)

-- Lobby: čekej na MIN hráčů, pak odpočet nebo okamžitý start
local function tryStartGame()
	local list = Players:GetPlayers()
	local count = 0
	for _, p in ipairs(list) do
		if p and not p:IsDescendantOf(nil) then count = count + 1 end
	end
	if count < MIN then
		broadcastState("Lobby", { waiting = MIN - count })
		return
	end
	-- Omez na MAX
	playersInRound = {}
	for i = 1, math.min(MAX, count) do
		table.insert(playersInRound, list[i].UserId)
	end
	roundNumber = 1
	for _, uid in ipairs(playersInRound) do
		scores[uid] = scores[uid] or 0
	end
	gameState = "Playing"
	alive = {}
	-- Vytvoř arénu pokud ještě neexistuje
	local arena = workspace:FindFirstChild("ArenaFloor")
	if not arena then
		ArenaManager.createArena(workspace)
	end
	spawnAll()
	broadcastState("Playing")
end

-- Při připojení hráče
Players.PlayerAdded:Connect(function()
	if gameState == "Lobby" then
		task.delay(1, tryStartGame)
	end
end)

-- Při odpojení – zkontroluj živé
Players.PlayerRemoving:Connect(function(player)
	local uid = player.UserId
	alive[uid] = nil
	if gameState == "Playing" then
		if countAlive() <= 1 then
			gameState = "RoundEnd"
			local winner = getLastAlive()
			if winner then scores[winner] = (scores[winner] or 0) + 1 end
			broadcastState("RoundEnd", { winnerUserId = winner })
		end
	end
end)

-- Inicializace
gameState = "Lobby"
broadcastState("Lobby")
task.spawn(function()
	while true do
		task.wait(2)
		if gameState == "Lobby" then
			tryStartGame()
		end
	end
end)
