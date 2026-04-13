// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../InboxUser.sol";
import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

contract StringMatcherPod is InboxUser {
    constructor(address _inbox) {
        setInbox(_inbox);
    }

    function matchSecret(gtString calldata guess, address recipient) external onlyInbox {
        gtString memory secret = MpcCore.setPublicString("hello_coti_123");
        gtBool gtMatch = MpcCore.eq(guess, secret);
        ctBool resultForRecipient = MpcCore.offBoardToUser(gtMatch, recipient);

        // We respond directly with the underlying uint256 of the ciphertext boolean
        inbox.respond(abi.encode(ctBool.unwrap(resultForRecipient)));
    }
}
