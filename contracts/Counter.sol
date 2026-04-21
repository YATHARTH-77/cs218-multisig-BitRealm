// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title Counter
 * @notice A simple contract to track and increment a numerical value.
 */
contract Counter {
    /**
     * @notice Current value of the counter.
     */
    uint public x;

    /**
     * @notice Emitted when the counter is incremented.
     * @param by The amount by which the counter was increased.
     */
    event Increment(uint by);

    /**
     * @notice Increments the counter value by 1 and emits an event.
     */
    function inc() public {
        x += 1;
        emit Increment(1);
    }
}