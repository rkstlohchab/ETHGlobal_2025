// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "./PythPriceConsumer.sol";

/// @title RWAOracleAdapter
/// @notice Provides helper utilities for consuming Pyth prices alongside an ERC-3643 token.
/// @dev Assumes the linked token implements the IERC20Metadata interface (true for ERC-3643).
contract RWAOracleAdapter is Ownable {
    struct PriceQuote {
        uint256 price;
        uint8 decimals;
        uint64 publishTime;
    }

    IERC20Metadata public immutable token;
    PythPriceConsumer public priceConsumer;

    event PriceConsumerUpdated(address indexed newConsumer);

    error InvalidAddress(string parameter);

    /// @param tokenAddress Address of the deployed ERC-3643 token.
    /// @param consumerAddress Address of the deployed PythPriceConsumer contract.
    constructor(address tokenAddress, address consumerAddress) {
        if (tokenAddress == address(0)) revert InvalidAddress("token");
        if (consumerAddress == address(0)) revert InvalidAddress("consumer");

        token = IERC20Metadata(tokenAddress);
        priceConsumer = PythPriceConsumer(payable(consumerAddress));
    }

    /// @notice Updates the price consumer contract.
    /// @param newConsumer Address of the new consumer contract.
    function setPriceConsumer(address newConsumer) external onlyOwner {
        if (newConsumer == address(0)) revert InvalidAddress("consumer");
        priceConsumer = PythPriceConsumer(payable(newConsumer));
        emit PriceConsumerUpdated(newConsumer);
    }

    /// @notice Returns the latest price quote from the Pyth consumer.
    /// @return quote Struct containing price, decimals, and publish timestamp.
    function latestQuote() public view returns (PriceQuote memory quote) {
        (uint256 price, uint8 decimals, uint64 publishTime) = priceConsumer
            .latestPrice();
        quote = PriceQuote({price: price, decimals: decimals, publishTime: publishTime});
    }

    /// @notice Returns the price quote and the USD value for a given token amount.
    /// @param tokenAmount Amount of tokens to value (uses token decimals).
    /// @return quote Latest price quote.
    /// @return tokenValueUSD Amount valued in quote decimals (default 18 decimals).
    function quoteValue(uint256 tokenAmount)
        external
        view
        returns (PriceQuote memory quote, uint256 tokenValueUSD)
    {
        quote = latestQuote();

        uint8 tokenDecimalsValue = token.decimals();
        uint256 scale = 10 ** uint256(tokenDecimalsValue);

        tokenValueUSD = (tokenAmount * quote.price) / scale;
    }

    /// @notice Convenience helper exposing the token decimals.
    function tokenDecimals() external view returns (uint8) {
        return token.decimals();
    }
}

