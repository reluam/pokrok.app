--[[
	GameUI.lua (LocalScript v StarterPlayer > StarterPlayerScripts)
	Zobrazuje stav hry: Lobby / Počet živých / Kolo / Vítěz / Game Over.
	Vytvoří základní ScreenGui s labely, pokud neexistuje.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local GameState = Remotes:WaitForChild("GameState")

local function getOrCreateScreen()
	local gui = player:WaitForChild("PlayerGui")
	local name = "BombermanScreen"
	local screen = gui:FindFirstChild(name)
	if screen then return screen end

	screen = Instance.new("ScreenGui")
	screen.Name = name
	screen.ResetOnSpawn = false
	screen.Parent = gui

	-- Lobby / stav
	local status = Instance.new("TextLabel")
	status.Name = "StatusLabel"
	status.Size = UDim2.new(0.4, 0, 0.08, 0)
	status.Position = UDim2.new(0.3, 0, 0.02, 0)
	status.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
	status.TextColor3 = Color3.new(1, 1, 1)
	status.TextScaled = true
	status.Text = "Waiting for players..."
	status.Parent = screen

	-- "You got boomed"
	local hit = Instance.new("TextLabel")
	hit.Name = "HitLabel"
	hit.Size = UDim2.new(0.5, 0, 0.12, 0)
	hit.Position = UDim2.new(0.25, 0, 0.4, 0)
	hit.BackgroundColor3 = Color3.fromRGB(180, 60, 60)
	hit.TextColor3 = Color3.new(1, 1, 1)
	hit.TextScaled = true
	hit.Visible = false
	hit.Text = "BOOMED!"
	hit.Parent = screen

	return screen
end

local screen = getOrCreateScreen()
local statusLabel = screen:FindFirstChild("StatusLabel")

GameState.OnClientEvent:Connect(function(data)
	if not data or not statusLabel then return end
	local state = data.state or "Lobby"
	local round = data.round or 0
	local scores = data.scores or {}
	local winnerUserId = data.winnerUserId
	local playersInRound = data.playersInRound or {}

	if state == "Lobby" then
		local need = data.waiting or 0
		statusLabel.Text = need > 0 and ("Waiting for " .. need .. " more player(s)...") or "Get ready! Starting soon..."
	elseif state == "Playing" then
		local aliveCount = 0
		for _ in pairs(data.alive or {}) do aliveCount = aliveCount + 1 end
		statusLabel.Text = "Round " .. round .. " | Alive: " .. aliveCount
	elseif state == "RoundEnd" then
		local winner = winnerUserId and Players:GetPlayerByUserId(winnerUserId)
		local name = winner and winner.Name or "Someone"
		statusLabel.Text = "Round over! Winner: " .. name .. " 🎉"
	elseif state == "GameOver" then
		local winner = winnerUserId and Players:GetPlayerByUserId(winnerUserId)
		local name = winner and winner.Name or "Someone"
		statusLabel.Text = "🏆 GAME OVER – " .. name .. " wins! 🏆"
	end
end)

-- Počáteční text
statusLabel.Text = "Waiting for players..."
