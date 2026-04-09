// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {PodLibBase} from "../mpc/PodLibBase.sol";
import {PodUserSepolia} from "../mpc/PodUserSepolia.sol";
import {MpcAbiCodec} from "../mpccodec/MpcAbiCodec.sol";
import {IInbox} from "../IInbox.sol";
import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

// Interfaces mimicking the deployed DirectMessagePod ABI for selector resolution
interface IDirectMessagePod {
    // Under the hood, an `itString` struct (input text) converts implicitly to a `gtString` struct (garbled text) when traversing the bridge!
    // But importantly, `MpcAbiCodec` calculates the method selector BEFORE we run the ABI compilation mapping.
    // If we define this as `itString`, it will encode selector `receiveMessage(itString,address)` rather than `receiveMessage(gtString,address)`!
    // ALWAYS match the destination `gt` types in interfaces if your target takes `gt` types.
    function receiveMessage(gtString calldata message, address recipient) external;
}

contract DirectMessageEvm is PodLibBase, PodUserSepolia {
    using MpcAbiCodec for MpcAbiCodec.MpcMethodCallContext;

    // Track active requests to correlate them
    mapping(bytes32 => address) public requestSenders;

    event MessageDispatched(bytes32 indexed requestId, address indexed sender, address indexed recipient);
    event MessageReply(bytes32 indexed requestId, bytes32 originalId, string status);

    constructor() PodLibBase(msg.sender) {
        setInbox(INBOX_ADDRESS);
        configureCoti(MPC_EXECUTOR_ADDRESS, COTI_CHAIN_ID);
    }

    /// @notice Used if you redeploy the Pod contract.
    function setCotiContract(address _cotiContract) external onlyOwner {
        configureCoti(_cotiContract, COTI_CHAIN_ID);
    }

    /// @notice Dispatch a cross-chain garbled string.
    /// @param encryptedMessage The `itString` crafted via `@coti-io/coti-ethers` off-chain.
    /// @param recipient The address destination of the message.
    /// @param callbackFeeLocalWei Estimated ETH fee to relay the response back to Sepolia.
    function sendMessage(itString memory encryptedMessage, address recipient, uint256 callbackFeeLocalWei) external payable returns (bytes32) {
        // Construct the cross-chain method dispatch dynamically via MpcAbiCodec
        MpcAbiCodec.MpcMethodCallContext memory ctx = MpcAbiCodec.create(IDirectMessagePod.receiveMessage.selector, 2);
        ctx = MpcAbiCodec.addArgument(ctx, encryptedMessage);
        ctx = MpcAbiCodec.addArgument(ctx, recipient);
        IInbox.MpcMethodCall memory methodCall = MpcAbiCodec.build(ctx);


        uint256 totalValueWei = msg.value;

        // Perform the dispatch using PodLib abstracted _sendTwoWayWithFee
        bytes32 requestId = _sendTwoWayWithFee(
            totalValueWei,
            callbackFeeLocalWei,
            cotiChainId,
            mpcExecutorAddress,
            methodCall,
            this.onMessageReceived.selector,
            this.onDefaultMpcError.selector
        );

        requestSenders[requestId] = msg.sender;
        emit MessageDispatched(requestId, msg.sender, recipient);

        return requestId;
    }

    /// @notice Handled implicitly by `InboxUser`. The Pod contract executes `inbox.respond(abi.encode(requestId, "Message received seamlessly"))`.
    function onMessageReceived(bytes memory resultData) external onlyInbox {
        bytes32 requestId = IInbox(inbox).inboxSourceRequestId();
        if (requestId == bytes32(0)) {
            requestId = IInbox(inbox).inboxRequestId();
        }
        (bytes32 originalId, string memory statusMsg) = abi.decode(resultData, (bytes32, string));
        emit MessageReply(requestId, originalId, statusMsg);
    }

}
