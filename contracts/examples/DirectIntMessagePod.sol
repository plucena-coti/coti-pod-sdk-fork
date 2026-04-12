// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../InboxUser.sol";
import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

/// @title DirectIntMessagePod
/// @notice A cross-chain message relayer acting as the COTI-side execution for the DirectMessage DApp.
/// Uses Integers instead of Strings to bypass dynamic array encoding issues in the bridge.
contract DirectIntMessagePod is InboxUser {
    event CiphertextSaved(bytes32 indexed msgId, address indexed recipient);

    // Storing the ctUint64 for each recipient
    mapping(bytes32 => ctUint64) private userMessages;

    constructor(address _inbox) {
        setInbox(_inbox);
    }

    /// @notice Called by the Relayer Inbox exclusively.
    /// @param message The encrypted uint64 message from EVM, implicitly decrypted into a garbled int.
    /// @param recipient The address this message is for.
    function receiveMessage(gtUint64 message, address recipient) external onlyInbox {
        // Off-board the garbled uint64 into a cipher state exclusively for the recipient
        ctUint64 cipherForRecipient = MpcCore.offBoardToUser(message, recipient);
        
        bytes32 requestId = inbox.inboxSourceRequestId();
        if (requestId == bytes32(0)) {
            requestId = inbox.inboxRequestId();
        }
        userMessages[requestId] = cipherForRecipient;

        emit CiphertextSaved(requestId, recipient);

        inbox.respond(abi.encode(requestId, "Int message received seamlessly"));
    }

    /// @notice Allows the recipient to view the securely stored encrypted message
    /// @dev Users on COTI invoke this natively using their respective AES keys
    function getMessage(bytes32 messageId) external view returns (ctUint64) {
        return userMessages[messageId];
    }
}
