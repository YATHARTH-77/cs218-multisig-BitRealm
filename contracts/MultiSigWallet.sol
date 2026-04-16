// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// SECURITY FIX: We added "is ReentrancyGuard" right here
contract MultiSigWallet is ReentrancyGuard {
    // --- Events ---
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(address indexed owner, uint indexed txIndex, address indexed to, uint value, bytes data);
    event ApproveTransaction(address indexed owner, uint indexed txIndex);
    event RevokeApproval(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    // --- State Variables ---
    address[] public owners; 
    mapping(address => bool) public isOwner; 
    uint public requiredApprovals; 

    // --- The Transaction Structure ---
    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint approvalCount;
    }

    Transaction[] public transactions; 
    mapping(uint => mapping(address => bool)) public isApproved;

    // --- Modifiers (The Security Bouncers) ---
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notApproved(uint _txIndex) {
        require(!isApproved[_txIndex][msg.sender], "Transaction already approved");
        _;
    }

    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "Transaction already executed");
        _;
    }

    // --- Constructor ---
    constructor(address[] memory _owners, uint _requiredApprovals) {
        require(_owners.length > 0, "Owners required");
        require(
            _requiredApprovals > 0 && _requiredApprovals <= _owners.length,
            "Invalid required number of owners"
        );

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }
        
        requiredApprovals = _requiredApprovals;
    }

    // --- Receive Function ---
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
    
    // --- Core Functions ---
    function submitTransaction(address _to, uint _value, bytes calldata _data)
        external
        onlyOwner
        returns (uint txIndex)
    {
        txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                approvalCount: 0
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
        return txIndex; 
    }

    function approveTransaction(uint _txIndex)
        external
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notApproved(_txIndex)
    {
        isApproved[_txIndex][msg.sender] = true;
        transactions[_txIndex].approvalCount += 1;

        emit ApproveTransaction(msg.sender, _txIndex);
    }

    function revokeApproval(uint _txIndex)
        external
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        require(isApproved[_txIndex][msg.sender], "Transaction not approved by you");

        isApproved[_txIndex][msg.sender] = false;
        transactions[_txIndex].approvalCount -= 1;

        emit RevokeApproval(msg.sender, _txIndex);
    }

    function executeTransaction(uint _txIndex)
        external
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        nonReentrant // This will work perfectly now!
    {
        Transaction storage transaction = transactions[_txIndex];

        require(transaction.approvalCount >= requiredApprovals, "Not enough approvals");

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    // --- Helper Functions for the Frontend ---
    function getTransactionCount() external view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _txIndex)
        external
        view
        txExists(_txIndex)
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint approvalCount
        )
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.approvalCount
        );
    }
}