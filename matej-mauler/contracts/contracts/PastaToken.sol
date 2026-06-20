// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title PastaToken ($RAGU) — Spaghetti City's in-game currency.
/// @notice Minting is gated to addresses flagged by the owner (the relayer for the starter
///         airdrop, and the City contract for building yield). Burnable, so the economy has
///         real sinks (claiming parcels / building costs burn $RAGU).
contract PastaToken is ERC20Burnable, Ownable {
    mapping(address => bool) public isMinter;

    event MinterSet(address indexed account, bool allowed);

    error NotMinter();

    constructor(address initialOwner) ERC20("Ragu", "RAGU") Ownable(initialOwner) {
        isMinter[initialOwner] = true;
        emit MinterSet(initialOwner, true);
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        isMinter[account] = allowed;
        emit MinterSet(account, allowed);
    }

    function mint(address to, uint256 amount) external {
        if (!isMinter[msg.sender]) revert NotMinter();
        _mint(to, amount);
    }
}
