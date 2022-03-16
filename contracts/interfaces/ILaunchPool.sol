pragma ton-solidity ^0.57.1;
pragma AbiHeader expire;

interface ILaunchPool {
    enum LaunchPoolStatus {Initializing, AwaitTokens, Active, Vesting, Complete, Failed}
    
    struct VestingPeriod {
        uint32 unfreezeTime;
        uint16 percent;
    }

    struct PendingDeposit {
        address user;
        uint128 amount;
        address sendGasTo;
        uint32 nonce;
    }

    struct LaunchPoolDetails {
        address launchTokenRoot;
        address tokenWallet;
        address owner;
        address factory;
        LaunchPoolStatus state;
        uint128 tokensSupply;
        uint128 totalRaised;
        uint128 totalWithdraw;
        uint128 totalReturned;
        uint32 startTime;
        uint32 endTime;
        uint128 softCap;
        uint128 hardCap;
        VestingPeriod[] vestingPeriods;
        AdditionalProjectInfo additionalProjectInfo;
        uint32 amountOfInvestors;
    }

    struct AdditionalProjectInfo {
        string projectName;
        string projectDescription;
        string projectImageUrl;
        string projectLandingUrl;
        SocialLink[] projectSocialLinks;
    }

    struct SocialLink {
        string name;
        string link;
    }

    event NewInvestment(
        address poolPartisipation,
        address owner,
        uint128 depositAmount
    );

    event SurplusDepositReturned(
        address user,
        uint128 surplusDeposit
    );

    event DepositReturned(
        address user,
        uint128 deposit
    );

    event ClaimRewarded(
        address user,
        uint128 sum
    );

    event LaunchPoolDeployed(
        address factory,
        uint64 deployNonce
    );

    event launchPoolAwaitTokensCallback(
        address factory,
        uint64 deployNonce
    );

    event LaunchPoolHasBeenActivated(
        address factory,
        uint64 deployNonce
    );

    event InvestmentViaBridgeDeclined(
        address user,
        uint128 sum
    );

    function processClaimReward(
        uint32 claimFrom,
        uint32 claimTo,
        uint128 userDeposit,
        address user,
        uint32 callbackId
    ) external;
    
    function processReturnDepositSulpur(
        uint128 userDeposit,
        address user,
        uint32 callbackId
    ) external;
    
    function processReturnDeposit(
        uint128 userDeposit,
        address user,
        uint32 callbackId
    ) external;

    function onDepositIncreased(uint32 _depositNonce) external;
}
