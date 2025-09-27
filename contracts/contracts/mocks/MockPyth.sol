// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/// @title MockPyth
/// @notice Minimal mock implementation of the IPyth interface for testing purposes only.
contract MockPyth is IPyth {
    struct InternalPrice {
        int64 price;
        int32 expo;
        uint64 publishTime;
    }

    mapping(bytes32 => InternalPrice) private _prices;

    uint256 public updateFee;
    uint256 public validTimePeriod;

    event PriceStored(bytes32 indexed priceId, int64 price, int32 expo, uint64 publishTime);

    constructor(uint256 _validTimePeriod, uint256 _updateFee) {
        validTimePeriod = _validTimePeriod;
        updateFee = _updateFee;
    }

    function setUpdateFee(uint256 newFee) external {
        updateFee = newFee;
    }

    function setValidTimePeriod(uint256 newPeriod) external {
        validTimePeriod = newPeriod;
    }

    function pushPrice(
        bytes32 priceId,
        int64 price,
        int32 expo,
        uint64 publishTime
    ) external {
        _storePrice(priceId, price, expo, publishTime);
    }

    function getPriceUnsafe(bytes32 id) public view override returns (PythStructs.Price memory price) {
        InternalPrice memory stored = _prices[id];
        require(stored.publishTime != 0, "MockPyth: price not set");
        price = PythStructs.Price({
            price: stored.price,
            conf: 0,
            expo: stored.expo,
            publishTime: stored.publishTime
        });
    }

    function getPriceNoOlderThan(bytes32 id, uint age)
        external
        view
        override
        returns (PythStructs.Price memory price)
    {
        price = getPriceUnsafe(id);
        require(block.timestamp <= price.publishTime + age, "MockPyth: stale price");
    }

    function getEmaPriceUnsafe(bytes32 id)
        external
        view
        override
        returns (PythStructs.Price memory price)
    {
        return getPriceUnsafe(id);
    }

    function getEmaPriceNoOlderThan(bytes32 id, uint age)
        external
        view
        override
        returns (PythStructs.Price memory price)
    {
        price = getPriceUnsafe(id);
        require(block.timestamp <= price.publishTime + age, "MockPyth: stale price");
    }

    function updatePriceFeeds(bytes[] calldata updateData) public payable override {
        uint256 requiredFee = getUpdateFee(updateData);
        require(msg.value >= requiredFee, "MockPyth: insufficient fee");

        for (uint256 i = 0; i < updateData.length; i++) {
            (bytes32 priceId, int64 priceValue, int32 expoValue, uint64 publishTime) = abi.decode(
                updateData[i],
                (bytes32, int64, int32, uint64)
            );
            _storePrice(priceId, priceValue, expoValue, publishTime);
        }
    }

    function updatePriceFeedsIfNecessary(
        bytes[] calldata,
        bytes32[] calldata,
        uint64[] calldata
    ) external payable override {
        revert("MockPyth: not implemented");
    }

    function getUpdateFee(bytes[] calldata updateData) public view override returns (uint feeAmount) {
        return updateFee * updateData.length;
    }

    function getTwapUpdateFee(bytes[] calldata updateData) external view override returns (uint feeAmount) {
        return updateFee * updateData.length;
    }

    function parsePriceFeedUpdates(
        bytes[] calldata,
        bytes32[] calldata,
        uint64,
        uint64
    ) external payable override returns (PythStructs.PriceFeed[] memory) {
        revert("MockPyth: not implemented");
    }

    function parsePriceFeedUpdatesWithConfig(
        bytes[] calldata,
        bytes32[] calldata,
        uint64,
        uint64,
        bool,
        bool,
        bool
    ) external payable override returns (PythStructs.PriceFeed[] memory, uint64[] memory) {
        revert("MockPyth: not implemented");
    }

    function parseTwapPriceFeedUpdates(
        bytes[] calldata,
        bytes32[] calldata
    ) external payable override returns (PythStructs.TwapPriceFeed[] memory) {
        revert("MockPyth: not implemented");
    }

    function parsePriceFeedUpdatesUnique(
        bytes[] calldata,
        bytes32[] calldata,
        uint64,
        uint64
    ) external payable override returns (PythStructs.PriceFeed[] memory) {
        revert("MockPyth: not implemented");
    }

    function queryPriceFeed(bytes32 id) public view returns (PythStructs.PriceFeed memory priceFeed) {
        InternalPrice memory stored = _prices[id];
        require(stored.publishTime != 0, "MockPyth: price not set");

        priceFeed = PythStructs.PriceFeed({
            id: id,
            price: PythStructs.Price({
                price: stored.price,
                conf: 0,
                expo: stored.expo,
                publishTime: stored.publishTime
            }),
            emaPrice: PythStructs.Price({
                price: stored.price,
                conf: 0,
                expo: stored.expo,
                publishTime: stored.publishTime
            })
        });
    }

    function priceFeedExists(bytes32 id) public view returns (bool exists) {
        return _prices[id].publishTime != 0;
    }

    function getValidTimePeriod() public view returns (uint validTimePeriod_) {
        validTimePeriod_ = validTimePeriod;
    }

    function getPrice(bytes32 id) external view returns (PythStructs.Price memory price) {
        price = getPriceUnsafe(id);
    }

    function getEmaPrice(bytes32 id) external view returns (PythStructs.Price memory price) {
        price = getPriceUnsafe(id);
    }

    function _storePrice(bytes32 priceId, int64 priceValue, int32 expoValue, uint64 publishTime) private {
        _prices[priceId] = InternalPrice({
            price: priceValue,
            expo: expoValue,
            publishTime: publishTime
        });

        emit PriceStored(priceId, priceValue, expoValue, publishTime);
    }

    receive() external payable {}
}

