// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {PodLib} from "../mpc/PodLib.sol";
import {PodLibBase} from "../mpc/PodLibBase.sol";
import {PodUserSepolia} from "../mpc/PodUserSepolia.sol";
import {MpcAbiCodec} from "../mpccodec/MpcAbiCodec.sol";
import {IInbox} from "../IInbox.sol";
import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

interface IStringMatcherPod {
    function matchSecret(gtString calldata guess, address recipient) external;
}

contract StringMatcherEvm is PodLib, PodUserSepolia {
    using MpcAbiCodec for MpcAbiCodec.MpcMethodCallContext;

    event MatchRequested(bytes32 indexed requestId, address indexed caller);
    event MatchCompleted(bytes32 indexed requestId, uint256 ctBoolResult);

    mapping(bytes32 => uint256) public resultByRequest;
    mapping(bytes32 => uint8) public statusByRequest; // 0 = None, 1 = Pending, 2 = Completed, 3 = Error

    constructor() PodLibBase(msg.sender) {}

    function setCotiContract(address _cotiContract) external onlyOwner {
        configureCoti(_cotiContract, COTI_CHAIN_ID);
    }

    function matchGuess(
        itString calldata guess,
        address recipient,
        uint256 callbackFeeWei
    ) external payable returns (bytes32) {
        
        MpcAbiCodec.MpcMethodCallContext memory ctx = MpcAbiCodec.create(IStringMatcherPod.matchSecret.selector, 2);
        ctx = MpcAbiCodec.addArgument(ctx, guess);
        ctx = MpcAbiCodec.addArgument(ctx, recipient);
        IInbox.MpcMethodCall memory methodCall = MpcAbiCodec.build(ctx);

        bytes32 requestId = _sendTwoWayWithFee(
            msg.value,
            callbackFeeWei,
            cotiChainId,
            mpcExecutorAddress,
            methodCall,
            this.matchCallback.selector,
            this.onDefaultMpcError.selector
        );

        statusByRequest[requestId] = 1;
        emit MatchRequested(requestId, msg.sender);

        return requestId;
    }

    function matchCallback(bytes memory data) external onlyInbox {
        bytes32 requestId = IInbox(inbox).inboxSourceRequestId();
        if (requestId == bytes32(0)) {
            requestId = IInbox(inbox).inboxRequestId();
        }

        uint256 ctResult = abi.decode(data, (uint256));
        resultByRequest[requestId] = ctResult;
        statusByRequest[requestId] = 2; // Completed

        emit MatchCompleted(requestId, ctResult);
    }
}
