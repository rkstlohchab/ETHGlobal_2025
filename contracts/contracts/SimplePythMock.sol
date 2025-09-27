// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


contract SimplePythMock {
    struct Price {
        int256 price;
        uint64 conf;
        int32 expo;
        uint64 publishTime;
    }

    mapping(bytes32 => Price) public prices;

    // Admin set price (local dev only)
    function setPrice(
        bytes32 priceId,
        int256 _price,
        uint64 _conf,
        int32 _expo,
        uint64 _publishTime
    ) external {
        prices[priceId] = Price({price: _price, conf: _conf, expo: _expo, publishTime: _publishTime});
    }

    // Minimal "update" flow used by consumer contracts — no fee in mock
    function getUpdateFee(bytes[] calldata) external pure returns (uint256) {
        return 0;
    }

    function updatePriceFeeds(bytes[] calldata) external payable {
        // No-op in mock (real Pyth validates signed updates)
    }

    function getValidTimePeriod() external pure returns (uint256) {
        return 3600; // e.g. 1 hour for local tests
    }

    // Returns tuple similar to a simplified Pyth getPrice
    function getPrice(bytes32 priceId) external view returns (int256, uint64, int32, uint64) {
        Price memory p = prices[priceId];
        return (p.price, p.conf, p.expo, p.publishTime);
    }
}
