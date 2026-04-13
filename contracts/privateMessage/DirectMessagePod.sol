// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../InboxUser.sol";
import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

/// @title DirectMessagePod
/// @notice A cross-chain message relayer acting as the COTI-side execution for the DirectMessage DApp.
contract DirectMessagePod is InboxUser {
    event CiphertextSaved(bytes32 indexed msgId, address indexed recipient);

    // Storing the ctString for each recipient
    // Using mapping from an explicit message ID instead of just recipient, so users can have multiple messages
    mapping(bytes32 => ctString) private userMessages;

    constructor(address _inbox) {
        setInbox(_inbox);
    }

    /// @notice Called by the Relayer Inbox exclusively.
    /// @param message The encrypted plaintext message from EVM, implicitly decrypted into a garbled string.
    /// @param recipient The address this message is for.
    function receiveMessage(gtString calldata message, address recipient) external onlyInbox {
        // Off-board the garbled string into a cipher state exclusively for the recipient
        ctString memory cipherForRecipient = MpcCore.offBoardToUser(message, recipient);
        bytes32 requestId = inbox.inboxSourceRequestId();
        if (requestId == bytes32(0)) {
            requestId = inbox.inboxRequestId();
        }
        userMessages[requestId] = cipherForRecipient;

        emit CiphertextSaved(requestId, recipient);

        inbox.respond(abi.encode(requestId, "Message received seamlessly"));
    }


    /// @notice Allows the recipient to view the securely stored encrypted message
    /// @dev Users on COTI invoke this natively using their respective AES keys
    function getMessage(bytes32 messageId) external view returns (ctString memory) {
        return userMessages[messageId];
    }
}
