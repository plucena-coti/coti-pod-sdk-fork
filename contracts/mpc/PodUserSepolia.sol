// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

/// @title PodUserSepolia
/// @notice Sepolia deployment defaults for inbox and COTI routing.
/// @dev Does **not** inherit {PodUser} so it can be mixed with {PodLib} without duplicate base constructors.
///      Use: `contract MyApp is PodLib, PodUserSepolia` and in the constructor call `PodLibBase(owner)` then
///      `setInbox(INBOX_ADDRESS); configureCoti(MPC_EXECUTOR_ADDRESS, COTI_CHAIN_ID);`.
abstract contract PodUserSepolia {
    address internal constant INBOX_ADDRESS = 0xFa158f9e49C8bb77f971c3630EbCD23a8a88D14E;
    uint256 internal constant COTI_CHAIN_ID = 2632500;
    address internal constant MPC_EXECUTOR_ADDRESS = 0xC76aaE4F3810fBBd5d96b92DEFeBE0034405Ad9c;
}
