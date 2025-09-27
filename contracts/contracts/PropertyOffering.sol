// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title PropertyOffering
/// @notice Minimal primary market contract that sells ERC-3643 tokens representing a property.
/// Token pricing assumes 18 decimals on the underlying token. The seller deposits inventory
/// (tokens) and optionally ETH liquidity for buybacks. Investors buy a fraction of the property
/// by sending ETH and receive tokens in return. They can later sell tokens back to the contract
/// if liquidity is available.
contract PropertyOffering is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Token representing property shares (ERC-3643 compliant).
    IERC20 public immutable token;

    /// @dev Wallet that receives sale proceeds and manages the offering.
    address public immutable seller;

    /// @dev Price for 1 full token (1e18 units). Denominated in wei.
    uint256 public pricePerToken;

    /// @dev Total ETH raised from the primary sale.
    uint256 public totalRaised;

    /// @dev Emitted when an investor buys tokens.
    event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 paid);

    /// @dev Emitted when an investor sells tokens back to the contract.
    event TokensSold(address indexed seller, uint256 tokenAmount, uint256 received);

    /// @dev Emitted when the property owner updates the primary sale price.
    event PriceUpdated(uint256 newPrice);

    /// @dev Emitted when ETH proceeds are withdrawn by the property owner.
    event ProceedsWithdrawn(address indexed to, uint256 amount);

    /// @dev Emitted when additional liquidity is deposited to support redemptions.
    event LiquidityDeposited(address indexed from, uint256 amount);

    error InvalidZeroAddress();
    error AmountTooSmall();
    error InsufficientInventory();
    error InvalidEtherSent();
    error InsufficientLiquidity();
    error Unauthorized();

    modifier onlySeller() {
        if (msg.sender != seller) revert Unauthorized();
        _;
    }

    constructor(address token_, address seller_, uint256 pricePerToken_) {
        if (token_ == address(0) || seller_ == address(0)) revert InvalidZeroAddress();
        require(pricePerToken_ > 0, "Price must be positive");
        token = IERC20(token_);
        seller = seller_;
        pricePerToken = pricePerToken_;
    }

    /// @notice Returns the number of tokens still held by the offering contract.
    function availableSupply() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Returns the amount of ETH currently held (liquidity + un-withdrawn proceeds).
    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Purchase `tokenAmount` tokens by sending the exact amount of ETH required.
    /// @param tokenAmount Amount of tokens (in smallest units) to purchase.
    function buy(uint256 tokenAmount) external payable nonReentrant {
        if (tokenAmount == 0) revert AmountTooSmall();
        uint256 cost = _priceForAmount(tokenAmount);
        if (msg.value != cost) revert InvalidEtherSent();
        if (availableSupply() < tokenAmount) revert InsufficientInventory();

        totalRaised += cost;
        token.safeTransfer(msg.sender, tokenAmount);

        emit TokensPurchased(msg.sender, tokenAmount, cost);
    }

    /// @notice Sell tokens back to the contract in exchange for ETH, using the primary price.
    /// @param tokenAmount Amount of tokens (smallest units) to redeem.
    function sell(uint256 tokenAmount) external nonReentrant {
        if (tokenAmount == 0) revert AmountTooSmall();
        uint256 payout = _priceForAmount(tokenAmount);
        if (address(this).balance < payout) revert InsufficientLiquidity();

        token.safeTransferFrom(msg.sender, address(this), tokenAmount);

        (bool ok, ) = payable(msg.sender).call{value: payout}("");
        require(ok, "ETH transfer failed");

        emit TokensSold(msg.sender, tokenAmount, payout);
    }

    /// @notice Owner can adjust the primary price (denominated in wei per full token).
    /// @param newPrice New price for 1 token (1e18 units).
    function updatePrice(uint256 newPrice) external onlySeller {
        require(newPrice > 0, "Price must be positive");
        pricePerToken = newPrice;
        emit PriceUpdated(newPrice);
    }

    /// @notice Withdraw ETH raised from primary sales. Does not impact liquidity for redemptions
    /// provided the owner leaves some balance in the contract.
    function withdrawProceeds(uint256 amount) external onlySeller nonReentrant {
        if (amount == 0) revert AmountTooSmall();
        if (address(this).balance < amount) revert InsufficientLiquidity();
        (bool ok, ) = payable(seller).call{value: amount}("");
        require(ok, "ETH transfer failed");
        emit ProceedsWithdrawn(seller, amount);
    }

    /// @notice Deposit additional ETH to support secondary market sell orders.
    function depositLiquidity() external payable {
        if (msg.value == 0) revert AmountTooSmall();
        emit LiquidityDeposited(msg.sender, msg.value);
    }

    /// @dev Helper to compute price for a token amount.
    function _priceForAmount(uint256 tokenAmount) internal view returns (uint256) {
        // tokenAmount is in 1e18 units; pricePerToken is price for 1 token (1e18 units)
        return (tokenAmount * pricePerToken) / 1e18;
    }

    receive() external payable {
        emit LiquidityDeposited(msg.sender, msg.value);
    }
}

