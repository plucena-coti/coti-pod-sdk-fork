// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "../mpc/PodLib.sol";
import "../mpc/PodUserSepolia.sol";
import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

/// @title PrivateAdder
/// @notice Adds two encrypted uint64 values via PoD on Sepolia (SDK preset addresses).
contract PrivateAdder is PodLib, PodUserSepolia {
    enum RequestStatus {
        None,
        Pending,
        Completed
    }

    mapping(bytes32 => ctUint64) public sumByRequest;
    mapping(bytes32 => RequestStatus) public statusByRequest;

    event AddRequested(bytes32 indexed requestId, address indexed caller);
    event AddCompleted(bytes32 indexed requestId);

    constructor() PodLibBase(msg.sender) {
        setInbox(INBOX_ADDRESS);
        configureCoti(MPC_EXECUTOR_ADDRESS, COTI_CHAIN_ID);
    }

    /// @param callbackFeeLocalWei Wei reserved for the callback leg; must be <= msg.value (see SDK fee docs).
    function add(
        itUint64 calldata a,
        itUint64 calldata b,
        uint256 callbackFeeLocalWei
    ) external payable returns (bytes32 requestId) {
        requestId = add64(
            a,
            b,
            msg.sender,
            this.addCallback.selector,
            this.onDefaultMpcError.selector,
            msg.value,
            callbackFeeLocalWei
        );
        statusByRequest[requestId] = RequestStatus.Pending;
        emit AddRequested(requestId, msg.sender);
    }

    function addCallback(bytes memory data) external onlyInbox {
        bytes32 requestId = inbox.inboxSourceRequestId();
        if (requestId == bytes32(0)) {
            requestId = inbox.inboxRequestId();
        }

        ctUint64 sum = abi.decode(data, (ctUint64));
        sumByRequest[requestId] = sum;
        statusByRequest[requestId] = RequestStatus.Completed;
        emit AddCompleted(requestId);
    }
}