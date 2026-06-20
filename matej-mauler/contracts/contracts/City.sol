// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICitizenID {
    function idOf(address who) external view returns (uint256);
}

interface IPasta is IERC20 {
    function mint(address to, uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
}

/// @title City — on-chain economy for Spaghetti City.
/// @notice Parcels are ERC-721. Only citizens (holders of a soulbound CitizenID) may
///         participate. Claiming/building burn $RAGU (sinks); buildings produce $RAGU yield
///         over time (faucet). A minimal $RAGU-denominated market lets citizens trade parcels.
/// @dev    Spending $RAGU requires the caller to `approve` this contract first (a deliberate
///         teaching moment about ERC-20 allowances).
contract City is ERC721, Ownable {
    ICitizenID public immutable citizen;
    IPasta public immutable pasta;

    uint256 public constant GRID = 16; // 16x16 = 256 parcels
    uint8 public constant MAX_LEVEL = 5;

    uint256 public claimCost = 100 ether; // 100 RAGU to claim a parcel

    struct Parcel {
        uint8 building; // 0 = empty, else building type
        uint8 level; // 1..MAX_LEVEL
        uint64 lastHarvest; // timestamp of last yield settlement
    }

    mapping(uint256 => Parcel) public parcels; // parcelId => data
    mapping(uint8 => uint256) public yieldRate; // building type => RAGU per second per level
    mapping(uint8 => uint256) public buildCost; // building type => RAGU cost per build/upgrade
    mapping(uint256 => uint256) public salePrice; // parcelId => RAGU price (0 = not for sale)

    event ParcelClaimed(address indexed owner, uint256 indexed id);
    event Built(uint256 indexed id, uint8 building, uint8 level);
    event Harvested(uint256 indexed id, address indexed owner, uint256 amount);
    event Listed(uint256 indexed id, uint256 price);
    event Bought(uint256 indexed id, address indexed seller, address indexed buyer, uint256 price);

    error NotCitizen();
    error OutOfBounds();
    error NotParcelOwner();
    error UnknownBuilding();
    error MaxLevelReached();
    error NotForSale();

    constructor(address initialOwner, address citizenId, address pastaToken)
        ERC721("Spaghetti Parcel", "PARCEL")
        Ownable(initialOwner)
    {
        citizen = ICitizenID(citizenId);
        pasta = IPasta(pastaToken);
        // Default building #1: "Pasta Farm" — base economy.
        yieldRate[1] = 0.001 ether; // RAGU per second per level
        buildCost[1] = 50 ether;
    }

    modifier onlyCitizen() {
        if (citizen.idOf(msg.sender) == 0) revert NotCitizen();
        _;
    }

    /// @notice Claim an unowned parcel by burning `claimCost` $RAGU.
    function claim(uint256 id) external onlyCitizen {
        if (id >= GRID * GRID) revert OutOfBounds();
        pasta.burnFrom(msg.sender, claimCost);
        parcels[id].lastHarvest = uint64(block.timestamp);
        _safeMint(msg.sender, id); // reverts if already owned
        emit ParcelClaimed(msg.sender, id);
    }

    /// @notice Build (or upgrade) a building on a parcel you own, burning $RAGU.
    function build(uint256 id, uint8 buildingType) external onlyCitizen {
        if (ownerOf(id) != msg.sender) revert NotParcelOwner();
        uint256 cost = buildCost[buildingType];
        if (cost == 0) revert UnknownBuilding();
        _settle(id); // pay out pending yield at the current building/level first
        pasta.burnFrom(msg.sender, cost);
        Parcel storage p = parcels[id];
        if (p.building == buildingType) {
            if (p.level >= MAX_LEVEL) revert MaxLevelReached();
            p.level += 1;
        } else {
            p.building = buildingType;
            p.level = 1;
        }
        emit Built(id, p.building, p.level);
    }

    /// @notice Collect accrued $RAGU yield from a parcel you own.
    function harvest(uint256 id) external {
        if (ownerOf(id) != msg.sender) revert NotParcelOwner();
        _settle(id);
    }

    /// @notice Pending (unharvested) $RAGU yield for a parcel.
    function pending(uint256 id) public view returns (uint256) {
        Parcel memory p = parcels[id];
        if (p.building == 0) return 0;
        uint256 dt = block.timestamp - p.lastHarvest;
        return yieldRate[p.building] * p.level * dt;
    }

    function _settle(uint256 id) internal {
        uint256 amt = pending(id);
        parcels[id].lastHarvest = uint64(block.timestamp);
        if (amt > 0) {
            address owner = ownerOf(id);
            pasta.mint(owner, amt);
            emit Harvested(id, owner, amt);
        }
    }

    // ---------------------------------------------------------------- market

    /// @notice List a parcel you own for sale at `price` $RAGU (0 cancels the listing).
    function list(uint256 id, uint256 price) external {
        if (ownerOf(id) != msg.sender) revert NotParcelOwner();
        salePrice[id] = price;
        emit Listed(id, price);
    }

    /// @notice Buy a listed parcel, paying the seller in $RAGU.
    function buy(uint256 id) external onlyCitizen {
        uint256 price = salePrice[id];
        if (price == 0) revert NotForSale();
        address seller = ownerOf(id);
        _settle(id); // seller keeps yield accrued up to the sale
        salePrice[id] = 0;
        pasta.transferFrom(msg.sender, seller, price);
        _transfer(seller, msg.sender, id);
        emit Bought(id, seller, msg.sender, price);
    }

    // ---------------------------------------------------------------- admin

    function setBuilding(uint8 buildingType, uint256 ratePerSecPerLevel, uint256 cost) external onlyOwner {
        yieldRate[buildingType] = ratePerSecPerLevel;
        buildCost[buildingType] = cost;
    }

    function setClaimCost(uint256 cost) external onlyOwner {
        claimCost = cost;
    }

    /// @dev Clear any sale listing whenever a parcel changes hands.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (salePrice[tokenId] != 0) salePrice[tokenId] = 0;
        return super._update(to, tokenId, auth);
    }
}
