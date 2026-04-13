// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

contract DirectMessageCotiTest {
    event CiphertextSaved(address indexed recipient);
    mapping(address => ctString) private userMessages;

    function receiveMessageDirect(itString calldata message, address recipient) external {
        gtString memory gtMessage = MpcCore.validateCiphertext(message);
        
        // Use offBoard instead of offBoardToUser. It shouldn't depend on user's AES Key!
        ctString memory cipherForRecipient = MpcCore.offBoard(gtMessage);
        
        userMessages[recipient] = cipherForRecipient;
        emit CiphertextSaved(recipient);
    }
}
