pragma ton-solidity ^0.57.1;
pragma AbiHeader expire;

interface ILaunchPoolParticipationCallback {
    function claimRewardedCallback(uint32 callbackId) external;
    function depositSulpurReturnedCallback(uint32 callbackId) external;
    function depositReturnedCallback(uint32 callbackId) external;
}
