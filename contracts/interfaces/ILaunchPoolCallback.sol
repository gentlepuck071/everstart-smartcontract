pragma ton-solidity ^0.57.1;
pragma AbiHeader expire;

interface ILaunchPoolCallback {
    function launchPoolHasBeenActivatedCallback(uint32 callbackId) external;
    function launchPoolAwaitTokensCallback(uint32 callbackId) external;
    function investmentViaBridgeDeclinedCallback(uint32 callbackId) external;
    function newInvestmentCallback(uint32 callbackId) external;
}
