export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const MULTISIG_ABI = [
  // Read
  "function owners(uint256) view returns (address)",
  "function requiredApprovals() view returns (uint256)",
  "function getTransactionCount() view returns (uint256)",
  "function getTransaction(uint256 _txId) view returns (address to, uint256 value, bytes data, bool executed, uint256 approvalCount)",
  "function isOwner(address) view returns (bool)",
  "function isApproved(uint256, address) view returns (bool)",

  // Write
  "function submitTransaction(address _to, uint256 _value, bytes _data) returns (uint256)",
  "function approveTransaction(uint256 _txId)",
  "function revokeApproval(uint256 _txId)",
  "function executeTransaction(uint256 _txId)",

  // Events
  "event SubmitTransaction(address indexed owner, uint256 indexed txId, address indexed to, uint256 value, bytes data)",
  "event Approved(address indexed owner, uint256 indexed txId)",
  "event Revoked(address indexed owner, uint256 indexed txId)",
  "event Executed(address indexed owner, uint256 indexed txId)",
] as const;