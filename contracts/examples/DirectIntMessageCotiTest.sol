// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

contract DirectIntMessageCotiTest {
    event CiphertextSaved(address indexed recipient);
    mapping(address => ctUint64) private userMessages;

    function receiveMessageDirect(itUint64 calldata message, address recipient) external {
        gtUint64 gtMessage = MpcCore.validateCiphertext(message);
        
        // Use offBoard instead of offBoardToUser. It shouldn't depend on user's AES Key because it is coming from another user
        ctUint64 cipherForRecipient = MpcCore.offBoard(gtMessage);
        
        userMessages[recipient] = cipherForRecipient;
        emit CiphertextSaved(recipient);
    }
}
