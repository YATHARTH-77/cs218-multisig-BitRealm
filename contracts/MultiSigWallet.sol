// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MultiSigWallet is ReentrancyGuard {
    event SubmitTransaction(address indexed owner, uint indexed txId, address indexed to, uint value, bytes data);
    event Approved(address indexed owner, uint indexed txId);
    event Revoked(address indexed owner, uint indexed txId);
    event Executed(address indexed owner, uint indexed txId);

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint approvalCount;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public requiredApprovals;

    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public isApproved;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint _txId) {
        require(_txId < transactions.length, "tx does not exist");
        _;
    }

    modifier notExecuted(uint _txId) {
        require(!transactions[_txId].executed, "tx already executed");
        _;
    }

    constructor(address[] memory _owners, uint _requiredApprovals) {
        require(_owners.length > 0, "owners required");
        require(_requiredApprovals > 0 && _requiredApprovals <= _owners.length, "invalid threshold");
        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }
        requiredApprovals = _requiredApprovals;
    }

    receive() external payable {}

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _txId) public view returns (
        address to, uint value, bytes memory data, bool executed, uint approvalCount
    ) {
        Transaction storage transaction = transactions[_txId];
        return (transaction.to, transaction.value, transaction.data, transaction.executed, transaction.approvalCount);
    }

    function submitTransaction(address _to, uint _value, bytes calldata _data) public onlyOwner returns (uint) {
        uint txId = transactions.length;
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            approvalCount: 0
        }));
        emit SubmitTransaction(msg.sender, txId, _to, _value, _data);
        return txId;
    }

    function approveTransaction(uint _txId) public onlyOwner txExists(_txId) notExecuted(_txId) {
        require(!isApproved[_txId][msg.sender], "tx already approved");
        Transaction storage transaction = transactions[_txId];
        transaction.approvalCount += 1;
        isApproved[_txId][msg.sender] = true;
        emit Approved(msg.sender, _txId);
    }

    function revokeApproval(uint _txId) public onlyOwner txExists(_txId) notExecuted(_txId) {
        require(isApproved[_txId][msg.sender], "tx not approved");
        Transaction storage transaction = transactions[_txId];
        transaction.approvalCount -= 1;
        isApproved[_txId][msg.sender] = false;
        emit Revoked(msg.sender, _txId);
    }

    function executeTransaction(uint _txId) public onlyOwner txExists(_txId) notExecuted(_txId) nonReentrant {
        Transaction storage transaction = transactions[_txId];
        require(transaction.approvalCount >= requiredApprovals, "cannot execute");
        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "tx failed");
        emit Executed(msg.sender, _txId);
    }
}