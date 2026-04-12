// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {PodLib} from "../mpc/PodLib.sol";
import {PodLibBase} from "../mpc/PodLibBase.sol";
import {PodUserSepolia} from "../mpc/PodUserSepolia.sol";
import {MpcAbiCodec} from "../mpccodec/MpcAbiCodec.sol";
import {IInbox} from "../IInbox.sol";
import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

interface IDirectIntMessagePod {
    function receiveMessage(itUint64 calldata message, address recipient) external;
}

contract DirectIntMessageEvm is PodLib, PodUserSepolia {
    using MpcAbiCodec for MpcAbiCodec.MpcMethodCallContext;

    enum RequestStatus { None, Pending, Completed }
    mapping(bytes32 => RequestStatus) public statusByRequest;
    mapping(bytes32 => string) public statusMsgByRequest;
    mapping(bytes32 => address) public requestSenders;

    event MessageDispatched(bytes32 indexed requestId, address indexed sender, address indexed recipient);
    event MessageReply(bytes32 indexed requestId, bytes32 originalId, string status);

    constructor() PodLibBase(msg.sender) {}

    function setCotiContract(address _cotiContract) external onlyOwner {
        configureCoti(_cotiContract, COTI_CHAIN_ID);
    }

    function sendMessage(itUint64 memory encryptedMessage, address recipient, uint256 callbackFeeLocalWei) external payable returns (bytes32) {
        MpcAbiCodec.MpcMethodCallContext memory ctx = MpcAbiCodec.create(IDirectIntMessagePod.receiveMessage.selector, 2);
        
        // Pass itUint64!
        ctx = MpcAbiCodec.addArgument(ctx, encryptedMessage);
        ctx = MpcAbiCodec.addArgument(ctx, recipient);
        IInbox.MpcMethodCall memory methodCall = MpcAbiCodec.build(ctx);

        uint256 totalValueWei = msg.value;

        bytes32 requestId = _sendTwoWayWithFee(
            totalValueWei,
            callbackFeeLocalWei,
            cotiChainId,
            mpcExecutorAddress,
            methodCall,
            this.onMessageReceived.selector,
            this.onDefaultMpcError.selector
        );

        statusByRequest[requestId] = RequestStatus.Pending;
        requestSenders[requestId] = msg.sender;
        emit MessageDispatched(requestId, msg.sender, recipient);

        return requestId;
    }

    function onMessageReceived(bytes memory resultData) external onlyInbox {
        bytes32 requestId = IInbox(inbox).inboxSourceRequestId();
        if (requestId == bytes32(0)) {
            requestId = IInbox(inbox).inboxRequestId();
        }
        (bytes32 originalId, string memory statusMsg) = abi.decode(resultData, (bytes32, string));
        
        statusByRequest[originalId] = RequestStatus.Completed;
        statusMsgByRequest[originalId] = statusMsg;
        
        emit MessageReply(requestId, originalId, statusMsg);
    }
}
