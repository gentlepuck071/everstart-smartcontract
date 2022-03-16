pragma ton-solidity ^0.57.1;
pragma AbiHeader expire;


interface ILaunchPoolParticipation {
    struct LaunchPoolParticipationDetails {
        address launchPool;
        address user;
        uint128 depositAmount;
        uint32 lastClaim;
        bool sulpurReturned;
        bool depositReturned;
    }

    function increaseDeposit(uint32 _depositNonce, uint128 _depositAmount) external;
}
