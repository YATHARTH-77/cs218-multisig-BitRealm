// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title A highly optimized M-of-N Multi-Signature Wallet
/// @notice Requires a minimum number of owner approvals to execute a transaction
/// @dev Inherits OpenZeppelin's ReentrancyGuard for CEI pattern enforcement
contract MultiSigWallet is ReentrancyGuard {
    
    /// @notice Emitted when a new transaction is submitted
    /// @param owner The address of the owner who submitted it
    /// @param txId The unique index of the transaction
    /// @param to The target address for the transaction
    /// @param value The amount of ETH (in wei) sent
    /// @param data The encoded calldata payload
    event SubmitTransaction(address indexed owner, uint indexed txId, address indexed to, uint value, bytes data);
    
    /// @notice Emitted when an owner approves a pending transaction
    /// @param owner The address of the approving owner
    /// @param txId The index of the approved transaction
    event Approved(address indexed owner, uint indexed txId);
    
    /// @notice Emitted when an owner revokes a prior approval
    /// @param owner The address of the revoking owner
    /// @param txId The index of the revoked transaction
    event Revoked(address indexed owner, uint indexed txId);
    
    /// @notice Emitted when a transaction successfully executes
    /// @param owner The address of the owner who triggered execution
    /// @param txId The index of the executed transaction
    event Executed(address indexed owner, uint indexed txId);

    /// @dev Packed storage: bool and uint8 share a single 32-byte slot to save gas
    struct Transaction {
        address to;
        bool executed;
        uint8 approvalCount;
        uint value;
        bytes data;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public immutable requiredApprovals;

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

    /// @notice Initializes the multi-sig wallet with owners and an M-of-N threshold
    /// @param _owners Array of unique addresses to be registered as owners
    /// @param _requiredApprovals The number of approvals (M) required to execute
    constructor(address[] memory _owners, uint _requiredApprovals) {
        require(_owners.length > 0, "owners required");
        require(_requiredApprovals > 0 && _requiredApprovals <= _owners.length, "invalid threshold");
        
        for (uint i = 0; i < _owners.length; ) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
            
            // Gas Optimization: bypasses default overflow checks 
            unchecked { ++i; }
        }
        requiredApprovals = _requiredApprovals;
    }

    /// @notice Fallback function to allow the contract to receive ETH directly
    receive() external payable {}

    /// @notice Returns the total number of submitted transactions
    /// @return The length of the transactions array
    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    /// @notice Fetches the details of a specific transaction
    /// @param _txId The index of the transaction
    /// @return to The destination address
    /// @return value The ETH value attached
    /// @return data The encoded calldata
    /// @return executed Boolean indicating if it has been executed
    /// @return approvalCount The current number of yes votes
    function getTransaction(uint _txId) public view txExists(_txId) returns (
        address to, uint value, bytes memory data, bool executed, uint approvalCount
    ) {
        Transaction storage transaction = transactions[_txId];
        return (transaction.to, transaction.value, transaction.data, transaction.executed, transaction.approvalCount);
    }

    /// @notice Returns the list of owner addresses that have approved a specific transaction
    /// @dev Required by project rubric. Dynamically allocates memory based on approvalCount.
    /// @param _txId The index of the transaction to query
    /// @return An array of addresses that have approved the transaction
    function getApprovers(uint _txId) public view txExists(_txId) returns (address[] memory) {
        uint count = transactions[_txId].approvalCount;
        address[] memory approvers = new address[](count);
        uint index = 0;
        
        for (uint i = 0; i < owners.length; i++) {
            if (isApproved[_txId][owners[i]]) {
                approvers[index] = owners[i];
                unchecked { ++index; }
            }
        }
        return approvers;
    }

    /// @notice Submits a new transaction for owner approval
    /// @param _to The destination address of the transaction
    /// @param _value The amount of ETH (in wei) to send
    /// @param _data The transaction payload/calldata
    /// @return The index of the newly submitted transaction
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

    /// @notice Approves a pending transaction
    /// @param _txId The index of the transaction to approve
    function approveTransaction(uint _txId) public onlyOwner txExists(_txId) notExecuted(_txId) {
        require(!isApproved[_txId][msg.sender], "tx already approved");
        Transaction storage transaction = transactions[_txId];
        
        transaction.approvalCount += 1;
        isApproved[_txId][msg.sender] = true;
        
        emit Approved(msg.sender, _txId);
    }

    /// @notice Revokes a prior approval for a pending transaction
    /// @param _txId The index of the transaction to revoke approval from
    function revokeApproval(uint _txId) public onlyOwner txExists(_txId) notExecuted(_txId) {
        require(isApproved[_txId][msg.sender], "tx not approved");
        Transaction storage transaction = transactions[_txId];
        
        transaction.approvalCount -= 1;
        isApproved[_txId][msg.sender] = false;
        
        emit Revoked(msg.sender, _txId);
    }

    /// @notice Executes a fully approved transaction
    /// @dev Employs the Checks-Effects-Interactions pattern and ReentrancyGuard
    /// @param _txId The index of the transaction to execute
    function executeTransaction(uint _txId) public onlyOwner txExists(_txId) notExecuted(_txId) nonReentrant {
        Transaction storage transaction = transactions[_txId];
        require(transaction.approvalCount >= requiredApprovals, "cannot execute");
        
        // EFFECT: Mark as executed BEFORE the low-level call to prevent reentrancy
        transaction.executed = true;
        
        // INTERACTION
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "tx failed");
        
        emit Executed(msg.sender, _txId);
    }
}