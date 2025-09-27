// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/// @title PythPriceConsumer
/// @notice Fetches and normalizes price information from the Pyth oracle.
/// @dev This contract keeps no state about prices; it relies on the upstream Pyth
///      contract to persist the latest price updates. Callers are expected to supply
///      fresh update data when necessary.
contract PythPriceConsumer is Ownable {
    /// @notice Number of decimals returned by the normalized price (18 = 1e18).
    uint8 public constant PRICE_DECIMALS = 18;

    /// @notice Address of the on-chain Pyth contract.
    IPyth public immutable pyth;

    /// @notice Identifier of the Pyth price feed (e.g. ETH/USD feed ID).
    bytes32 public immutable priceId;

    /// @notice Maximum tolerated staleness in seconds when reading prices.
    uint256 public maxPriceAge;

    /// @dev Emitted when the acceptable price age is updated.
    event MaxPriceAgeUpdated(uint256 newMaxAge);

    error InvalidAddress(string parameter);
    error InvalidArgument(string parameter);
    error NonPositivePrice();
    error RefundFailed();

    /// @param pythAddress Address of the deployed Pyth contract on the target network.
    /// @param priceFeedId Identifier of the desired price feed.
    /// @param maxAgeSeconds Maximum age (in seconds) the caller is willing to accept when
    ///        reading prices via {latestPrice}.
    constructor(address pythAddress, bytes32 priceFeedId, uint256 maxAgeSeconds) {
        if (pythAddress == address(0)) revert InvalidAddress("pythAddress");
        if (priceFeedId == bytes32(0)) revert InvalidArgument("priceFeedId");
        if (maxAgeSeconds == 0) revert InvalidArgument("maxPriceAge");

        pyth = IPyth(pythAddress);
        priceId = priceFeedId;
        maxPriceAge = maxAgeSeconds;
    }

    /// @notice Updates the maximum acceptable price age.
    /// @param newMaxAge The new maximum age (in seconds).
    function setMaxPriceAge(uint256 newMaxAge) external onlyOwner {
        if (newMaxAge == 0) revert InvalidArgument("maxPriceAge");
        maxPriceAge = newMaxAge;
        emit MaxPriceAgeUpdated(newMaxAge);
    }

    /// @notice Returns the latest price from Pyth, ensuring it is fresh enough.
    /// @return price Normalized price with {PRICE_DECIMALS} decimals.
    /// @return decimals Number of decimals used for the returned price (always 18).
    /// @return publishTime Timestamp of the last price update.
    function latestPrice() public view returns (uint256 price, uint8 decimals, uint64 publishTime) {
        PythStructs.Price memory priceStruct = pyth.getPriceNoOlderThan(priceId, maxPriceAge);

        price = _normalise(priceStruct.price, priceStruct.expo);
        publishTime = uint64(priceStruct.publishTime);
        decimals = PRICE_DECIMALS;
    }

    /// @notice Returns the raw price struct without freshness guarantees.
    /// @return price Raw price value from Pyth.
    /// @return expo Exponent associated with the raw price.
    /// @return publishTime Timestamp of the last update.
    function latestPriceUnsafe() external view returns (int64 price, int32 expo, uint64 publishTime) {
        PythStructs.Price memory priceStruct = pyth.getPriceUnsafe(priceId);
        return (priceStruct.price, priceStruct.expo, uint64(priceStruct.publishTime));
    }

    /// @notice Returns the latest price with a custom staleness threshold.
    /// @param maxAgeSeconds Maximum acceptable age of the price in seconds.
    /// @return price Normalized price with {PRICE_DECIMALS} decimals.
    /// @return decimals Number of decimals used for the returned price (always 18).
    /// @return publishTime Timestamp of the last price update.
    function getPriceWithAge(uint256 maxAgeSeconds) external view returns (uint256 price, uint8 decimals, uint64 publishTime) {
        if (maxAgeSeconds == 0) revert InvalidArgument("maxAgeSeconds");

        PythStructs.Price memory priceStruct = pyth.getPriceNoOlderThan(priceId, maxAgeSeconds);

        price = _normalise(priceStruct.price, priceStruct.expo);
        publishTime = uint64(priceStruct.publishTime);
        decimals = PRICE_DECIMALS;
    }

    /// @notice Pushes fresh price updates to Pyth and refunds any excess fee.
    /// @param priceUpdateData Encoded price update payloads obtained from Pyth.
    /// @return feePaid Exact fee forwarded to the Pyth contract.
    function updatePriceFeeds(bytes[] calldata priceUpdateData)
        public
        payable
        returns (uint256 feePaid)
    {
        feePaid = pyth.getUpdateFee(priceUpdateData);
        if (msg.value < feePaid) revert InvalidArgument("insufficientFee");

        pyth.updatePriceFeeds{value: feePaid}(priceUpdateData);

        unchecked {
            uint256 refund = msg.value - feePaid;
            if (refund != 0) {
                (bool success, ) = msg.sender.call{value: refund}("");
                if (!success) revert RefundFailed();
            }
        }
    }

    /// @notice Convenience wrapper that updates the price and returns the latest value.
    /// @param priceUpdateData Encoded price update payloads obtained from Pyth.
    /// @return price Normalized price with {PRICE_DECIMALS} decimals.
    /// @return decimals Number of decimals used for the returned price (always 18).
    /// @return publishTime Timestamp of the last price update.
    function updateAndGetPrice(bytes[] calldata priceUpdateData)
        external
        payable
        returns (uint256 price, uint8 decimals, uint64 publishTime)
    {
        updatePriceFeeds(priceUpdateData);
        return latestPrice();
    }

    /// @dev Ensure no stray ether remains trapped on the contract.
    receive() external payable {
        revert InvalidArgument("directEtherTransfer");
    }

    /// @dev Converts the raw Pyth price into the configured {PRICE_DECIMALS} format.
    function _normalise(int64 price, int32 expo) internal pure returns (uint256) {
        if (price <= 0) revert NonPositivePrice();

        uint256 unsignedPrice = uint256(uint64(price));

        if (expo >= 0) {
            uint256 exponent = uint256(uint32(expo)) + PRICE_DECIMALS;
            return unsignedPrice * (10 ** exponent);
        }

        uint32 positiveExpo = uint32(uint32(-expo));

        if (PRICE_DECIMALS >= positiveExpo) {
            uint256 multiplier = 10 ** uint256(PRICE_DECIMALS - positiveExpo);
            return unsignedPrice * multiplier;
        }

        uint256 divisor = 10 ** uint256(positiveExpo - PRICE_DECIMALS);
        return unsignedPrice / divisor;
    }
}

