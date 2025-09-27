// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface ISimplePythMock {
    function getUpdateFee(bytes[] calldata) external view returns (uint256);
    function updatePriceFeeds(bytes[] calldata) external payable;
    function getPrice(bytes32 priceId) external view returns (int256, uint64, int32, uint64);
    function getValidTimePeriod() external view returns (uint256);
}

/// @title PropertyTokenLocal
/// @notice ERC20-like token representing tokenized real-estate shares with on-chain whitelist enforcement
contract PropertyTokenLocal is ERC20 {
    ISimplePythMock public pyth;
    bytes32 public priceId;
    address public admin;

    mapping(address => bool) public isWhitelisted;

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _pyth,
        bytes32 _priceId
    ) ERC20(_name, _symbol) {
        admin = msg.sender;
        pyth = ISimplePythMock(_pyth);
        priceId = _priceId;
    }

    // Admin controls the whitelist (connect to off-chain KYC system)
    function addWhitelist(address who) external onlyAdmin {
        isWhitelisted[who] = true;
    }

    function removeWhitelist(address who) external onlyAdmin {
        isWhitelisted[who] = false;
    }

    // Only admin can mint (typical for regulated assets)
    function mint(address to, uint256 amount) external onlyAdmin {
        require(isWhitelisted[to], "recipient not whitelisted");
        _mint(to, amount);
    }

    // Enforce whitelist on transfers (except mint/burn)
    function _beforeTokenTransfer(address from, address to, uint256) internal view {
        if (from != address(0) && to != address(0)) {
            require(isWhitelisted[from], "sender not whitelisted");
            require(isWhitelisted[to], "recipient not whitelisted");
        }
    }

    // Read price from the oracle (mock). In production use Pyth SDK functions.
    function getLatestPrice() external view returns (int256 price, uint64 conf) {
        (int256 _price, uint64 _conf, , ) = pyth.getPrice(priceId);
        return (_price, _conf);
    }
}
