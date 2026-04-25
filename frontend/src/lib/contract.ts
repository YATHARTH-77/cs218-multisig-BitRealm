// src/lib/contract.ts

// This is your LIVE Sepolia Testnet Address! 🚀
export const CONTRACT_ADDRESS = "0x6b5E5B84C2Ce587DEdC091C0605caD4803b05799";

// Human-Readable ABI - Ethers.js parses this perfectly!
export const MULTISIG_ABI = [
  // Read Functions (View)
  "function owners(uint256) view returns (address)",
  "function requiredApprovals() view returns (uint256)",
  "function getTransactionCount() view returns (uint256)",
  "function getApprovers(uint256 _txIndex) view returns (address[])",
  "function getTransaction(uint256 _txIndex) view returns (address to, uint256 value, bytes data, bool executed, uint8 approvalCount)",
  
  // Write Functions (State Changing)
  "function submitTransaction(address _to, uint256 _value, bytes _data)",
  "function approveTransaction(uint256 _txIndex)",
  "function revokeApproval(uint256 _txIndex)",
  "function executeTransaction(uint256 _txIndex)",
  
  // Events
  "event SubmitTransaction(address indexed owner, uint256 indexed txIndex, address indexed to, uint256 value, bytes data)",
  "event Approved(address indexed owner, uint256 indexed txIndex)",
  "event Revoked(address indexed owner, uint256 indexed txIndex)",
  "event Executed(address indexed owner, uint256 indexed txIndex)"
];