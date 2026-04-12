// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

contract Sniffer {
    event Sniffed(address caller, uint256 msgLength);

    function receiveMessage(gtUint64 message, address recipient) external {
        emit Sniffed(msg.sender, 0); 
    }
}
