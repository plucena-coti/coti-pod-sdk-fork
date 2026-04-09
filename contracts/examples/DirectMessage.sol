// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

/// @title DirectMessage
/// @notice A simple direct-to-COTI contract following careful decryption patterns
contract DirectMessage {
    
    // Internal counter for assigning message IDs
    uint256 public nextMessageId;
    
    // Mapping from message ID to an encrypted ciphertext string
    mapping(uint256 => ctString) private encryptedMessages;

    // Event emitting the newly stored message ID
    event MessageStored(uint256 indexed messageId, address indexed recipient);

    /// @notice Takes an encrypted inbound string, re-encrypts it for the specific recipient, and stores it
    /// @param message The user-submitted encrypted input text (`it*`)
    /// @param recipient The address whose AES key will be allowed to decrypt the state
    /// @return The newly generated message ID
    function receive_message(itString calldata message, address recipient) external returns (uint256) {
        
        // 1. Validate the inbound text and transition it to the compute domain (`gt*` Garbled Text)
        // This validates the user signature underneath `itString` ensuring it hasn't been tampered with.
        gtString memory gtMessage = MpcCore.validateCiphertext(message);

        // 2. Offboard the compute-domain value directly to the user.
        // This transcodes the garbled text into a format decryptable ONLY by the provided `recipient` address.
        // This follows the "Careful Decrypting" standard of avoiding globally viewable payloads.
        ctString memory ctMessage = MpcCore.offBoardToUser(gtMessage, recipient);

        // 3. Store the recipient-locked ciphertext in mapping
        uint256 id = nextMessageId++;
        encryptedMessages[id] = ctMessage;

        emit MessageStored(id, recipient);

        return id;
    }

    /// @notice Returns the cipher text for a given message ID
    /// @param id The message ID 
    /// @return The cipher text string (`ct*`)
    function read_message(uint256 id) external view returns (ctString memory) {
        return encryptedMessages[id];
    }
}
