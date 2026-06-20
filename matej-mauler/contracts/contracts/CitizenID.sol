// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CitizenID — soulbound digital identity for Spaghetti City.
/// @notice Non-transferable ERC-721. One citizenship per address. Minting is gated to a
///         rotatable `minter` (our relayer) so onboarding can be sponsored (gas paid by us).
contract CitizenID is ERC721, Ownable {
    uint256 public nextId = 1;
    address public minter;

    mapping(uint256 => string) public handleOf; // tokenId => chosen city handle
    mapping(address => uint256) public idOf; // address => tokenId (0 = not a citizen)

    event MinterChanged(address indexed minter);
    event CitizenMinted(address indexed to, uint256 indexed tokenId, string handle);

    error NotMinter();
    error AlreadyCitizen();
    error Soulbound();

    constructor(address initialOwner) ERC721("Spaghetti Citizen", "CITIZEN") Ownable(initialOwner) {
        minter = initialOwner;
        emit MinterChanged(initialOwner);
    }

    modifier onlyMinter() {
        if (msg.sender != minter) revert NotMinter();
        _;
    }

    /// @notice Rotate the minter (mitigates a hot-key compromise without redeploy).
    function setMinter(address m) external onlyOwner {
        minter = m;
        emit MinterChanged(m);
    }

    /// @notice Mint a soulbound citizenship. Reverts if `to` is already a citizen.
    function mint(address to, string calldata handle) external onlyMinter returns (uint256 id) {
        if (idOf[to] != 0) revert AlreadyCitizen();
        id = nextId++;
        idOf[to] = id;
        handleOf[id] = handle;
        _safeMint(to, id);
        emit CitizenMinted(to, id, handle);
    }

    function isCitizen(address who) external view returns (bool) {
        return idOf[who] != 0;
    }

    /// @dev Soulbound: allow mint (from == 0) and burn (to == 0), block every real transfer.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
