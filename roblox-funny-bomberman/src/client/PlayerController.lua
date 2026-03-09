--[[
	PlayerController.lua (LocalScript v StarterPlayer > StarterPlayerScripts)
	WASD pohyb, mezerník = položit bombu. Po zásahu výbuchem přehrát "funny" efekt.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local PlaceBomb = Remotes:WaitForChild("PlaceBomb")
local PlayerHit = Remotes:WaitForChild("PlayerHit")

-- Ovládání – bomba na mezerník
UserInputService.InputBegan:Connect(function(input, gameProcessed)
	if gameProcessed then return end
	if input.KeyCode == Enum.KeyCode.Space then
		PlaceBomb:FireServer()
	end
end)

-- Když nás trefí výbuch – server nás už zabil (Health=0), tady jen "funny" reakce
PlayerHit.OnClientEvent:Connect(function(killerUserId)
	-- Vtipný efekt: můžeš přidat zvuk "boom", velký text "BOOMED!", částice...
	-- print("You got BOOMED! Killer:", killerUserId)
	local gui = player:WaitForChild("PlayerGui", 5)
	if gui then
		local screen = gui:FindFirstChild("BombermanScreen")
		if screen then
			local hitLabel = screen:FindFirstChild("HitLabel")
			if hitLabel and hitLabel:IsA("TextLabel") then
				hitLabel.Visible = true
				hitLabel.Text = "💥 BOOMED! 💥"
				task.delay(2, function()
					hitLabel.Visible = false
				end)
			end
		end
	end
end)
