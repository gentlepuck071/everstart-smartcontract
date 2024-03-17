pragma ton-solidity ^0.57.1;
pragma AbiHeader expire;

import "./LaunchPoolParticipation.sol";

import "./errors/BaseErrors.sol";
import "./errors/LaunchPoolErrors.sol";
import "./libraries/gas/LaunchPoolGas.sol";

import "./access/InternalOwner.sol";
 
import "./interfaces/ITokenRoot.sol";
import "./interfaces/ITokenWallet.sol";
import "./interfaces/IAcceptTokensTransferCallback.sol";
import "./interfaces/ILaunchPoolParticipation.sol";
import "./interfaces/IReceiveTONsFromBridgeCallback.sol";
import "./interfaces/ILaunchPool.sol";
import "./interfaces/ILaunchPoolFactory.sol";
import "./interfaces/ILaunchPoolCallback.sol";
import "./interfaces/ILaunchPoolParticipationCallback.sol";

contract LaunchPool is InternalOwner, ILaunchPool, IAcceptTokensTransferCallback, IReceiveTONsFromBridgeCallback {

    TvmCell static launchPoolParticipationCode;
    uint64 static deployNonce;
    address static factory;

    // Deployed state
    uint32 startTime;                                                 // дата начала сбора средств
    uint32 endTime;                                                   // дата окончания сбора средств
    ILaunchPool.VestingPeriod[] vestingPeriods;

    uint128 softCap;
    uint128 hardCap;

    // Proceed state
    ILaunchPool.LaunchPoolStatus state;
    uint128 tokensSupply;                        // число распределяемых токенов
    uint128 totalRaised;                         // число собранных EVER
    uint128 totalWithdraw;                       // число выведенных EVER
    uint128 totalReturned;                       // число EVER, которые вернули себе пользователи, в случае если totalRaised превысил hardCap
    mapping (uint64 => PendingDeposit) deposits; // мапа с временными данными о депозитах
    uint32 depositNonce;                         // nonce депозита

    // TIP3
    address launchTokenRoot; // deployed
    address tokenWallet;

    // additional info
    AdditionalProjectInfo additionalProjectInfo;
    uint32 amountOfInvestors;

    constructor(
        address _owner,                                                    // адрес владельца пула
        address _launchTokenRoot,                                          // адрес TokenRoot
        uint32 _startTime,                                                 // дата начала сбора средств
        uint32 _endTime,                                                   // дата окончания сбора средств
        VestingPeriod[] _vestingPeriods,
        uint128 _softCap,
        uint128 _hardCap,
        address _sendGasTo,
        AdditionalProjectInfo _additionalProjectInfo
    ) public {
        require (msg.sender.value != 0 && msg.sender == factory, BaseErrors.called_not_from_fabric);
        tvm.rawReserve(LaunchPoolGas.INITIAL_BALANCE, 0);

        owner = _owner;
        launchTokenRoot = _launchTokenRoot;
        startTime = _startTime;
        endTime = _endTime;
        vestingPeriods = _vestingPeriods;
        softCap = _softCap;
        hardCap = _hardCap;
        additionalProjectInfo = _additionalProjectInfo;
        amountOfInvestors = 0;

        state = ILaunchPool.LaunchPoolStatus.Initializing;

        ITokenRoot(launchTokenRoot).deployWallet {
            value: LaunchPoolGas.DEPLOY_EMPTY_WALLET_VALUE,
            flag: 1,
            callback: LaunchPool.onTokenWallet
        } (
            address(this),                            // owner_address
            LaunchPoolGas.DEPLOY_EMPTY_WALLET_GRAMS   // deploy_grams
        );

        ILaunchPoolFactory(factory).onPoolDeploy{ value: LaunchPoolGas.FABRIC_DEPLOY_CALLBACK_VALUE } (
            deployNonce, _owner, _sendGasTo
        );

        emit LaunchPoolDeployed(factory, deployNonce);
        _sendGasTo.transfer({ value: 0, flag: 128, bounce: false });
    }

    modifier onlyState(ILaunchPool.LaunchPoolStatus requiredState) {
        require(requiredState == state, LaunchPoolErrors.wrong_state);
        _;
    }

    modifier afterStartTime() {
        require(startTime < now, LaunchPoolErrors.depositing_has_not_started);
        _;
    }

    modifier beforeEndTime() {
        require(now < endTime, LaunchPoolErrors.depositing_has_already_been_ended);
        _;
    }

    modifier afterEndTime() {
        require(endTime < now, LaunchPoolErrors.depositing_has_not_ended);
        _;
    }

    receive() external onlyState(ILaunchPool.LaunchPoolStatus.Active) afterStartTime beforeEndTime {
        // todo обойти бы для повторного инвестирования в уже существующий контракт
        require(
            msg.value > LaunchPoolGas.DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE + LaunchPoolGas.ASSIST_DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE,
            LaunchPoolErrors.low_deposit_gas
        );
        uint128 depositAmount = msg.value - LaunchPoolGas.DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE - LaunchPoolGas.ASSIST_DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE;
        _processDepositFrom(msg.sender, depositAmount);
    }

    function onReceiveTONsFromBridgeCallback(ICreditEventDataStructure.CreditEventData decodedEventData) override external {
        require(
            msg.value > LaunchPoolGas.DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE + LaunchPoolGas.ASSIST_DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE,
            LaunchPoolErrors.low_deposit_gas
        );
        require(state == ILaunchPool.LaunchPoolStatus.Active, LaunchPoolErrors.wrong_state);
        require(startTime < now, LaunchPoolErrors.depositing_has_not_started);
        require(now < endTime, LaunchPoolErrors.depositing_has_already_been_ended);
        TvmSlice layer3Slice = decodedEventData.layer3.toSlice();
        if (layer3Slice.bits() < 128) {
            emit InvestmentViaBridgeDeclined(decodedEventData.user, msg.value);
            ILaunchPoolCallback(decodedEventData.user).investmentViaBridgeDeclinedCallback{value: 0, flag: 64, bounce: false}(404);
            return;
        }
        uint128 gasForUser = layer3Slice.decode(uint128);
        if (gasForUser < LaunchPoolGas.DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE + LaunchPoolGas.ASSIST_DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE) {
            gasForUser = LaunchPoolGas.DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE + LaunchPoolGas.ASSIST_DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE;
        }
        if (gasForUser > msg.value) {
            uint32 callbackId = 404;
            if (layer3Slice.bits() >= 32) {
                callbackId = layer3Slice.decode(uint32);
            }
            emit InvestmentViaBridgeDeclined(decodedEventData.user, msg.value);
            ILaunchPoolCallback(decodedEventData.user).investmentViaBridgeDeclinedCallback{value: 1, flag: 1, bounce: false}(callbackId);
            decodedEventData.user.transfer(0, false, 64);
        } else {
            _processDepositFrom(decodedEventData.user, msg.value - gasForUser);
        }
    }

    function _processDepositFrom(address user, uint128 amount) private {
        totalRaised += amount;
        tvm.rawReserve(totalRaised + LaunchPoolGas.INITIAL_BALANCE, 0);
        deposits[depositNonce] = PendingDeposit(user, amount, user, depositNonce);
        address launchPoolParticipationAddress = getLaunchPoolParticipationAddress(user);
        ILaunchPoolParticipation(launchPoolParticipationAddress).increaseDeposit{value: 0, flag: 128}(depositNonce++, amount);
    }

    function getDetails() external view responsible returns (ILaunchPool.LaunchPoolDetails) {
        return { value: 0, bounce: false, flag: 64 }ILaunchPool.LaunchPoolDetails(
            launchTokenRoot, tokenWallet, owner, factory, state, tokensSupply, totalRaised, 
            totalWithdraw, totalReturned, startTime, endTime, softCap, hardCap, vestingPeriods, 
            additionalProjectInfo, amountOfInvestors
        );
    }

    function deployLaunchPoolParticipation(address _user) internal returns (address) {
        TvmCell stateInit = tvm.buildStateInit({
            contr: LaunchPoolParticipation,
            varInit: { user: _user, launchPool: address(this) },
            code: launchPoolParticipationCode
        });

        return new LaunchPoolParticipation{
            stateInit: stateInit,
            value: LaunchPoolGas.DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE,
            wid: address(this).wid,
            flag: 1
        }();
    }

    function getLaunchPoolParticipationAddress(address _user) public view returns (address) {
        TvmCell stateInit = tvm.buildStateInit({
            contr: LaunchPoolParticipation,
            varInit: { user: _user, launchPool: address(this) },
            code: launchPoolParticipationCode
        });
        return address(tvm.hash(stateInit));
    }

    function withdrawEVERs(uint128 amount, address to) external onlyOwner onlyState(ILaunchPool.LaunchPoolStatus.Complete) {
        require(totalWithdraw + amount <= math.min(totalRaised, hardCap), LaunchPoolErrors.bad_ever_withdrawal_value);
        totalWithdraw += amount;
        tvm.rawReserve(totalRaised - totalReturned - totalWithdraw + LaunchPoolGas.INITIAL_BALANCE, 0);
        to.transfer(0, false, 128);
    }

    function withdrawTokens(address to, address sendGasTo) external onlyOwner onlyState(ILaunchPool.LaunchPoolStatus.Failed) {
        require(tokensSupply > 0, LaunchPoolErrors.tokens_not_found);
        require(msg.value > LaunchPoolGas.WITHDRAW_TOKENS_VALUE, LaunchPoolErrors.low_withdraw_tokens_value);
        tvm.rawReserve(totalRaised - totalReturned - totalWithdraw + LaunchPoolGas.INITIAL_BALANCE, 0);
        TvmCell empty;
        ITokenWallet(tokenWallet).transfer{ value: 0, flag: 128 } (
            tokensSupply,
            to,
            LaunchPoolGas.DEPLOY_WALLET_GRAMS,
            sendGasTo,
            true,
            empty
        );
        tokensSupply = 0;
    }

    function finishFundraising() external afterEndTime onlyState(ILaunchPool.LaunchPoolStatus.Active) {
        tvm.rawReserve(totalRaised - totalReturned - totalWithdraw + LaunchPoolGas.INITIAL_BALANCE, 0);
        state = totalRaised >= softCap ? ILaunchPool.LaunchPoolStatus.Complete : ILaunchPool.LaunchPoolStatus.Failed;
        msg.sender.transfer(0, false, 128);
    }

    function processReturnDepositSulpur(
        uint128 userDeposit,
        address user,
        uint32 callbackId
    ) override external onlyState(ILaunchPool.LaunchPoolStatus.Complete) {
        address expectedAddress = getLaunchPoolParticipationAddress(user);
        require(msg.sender.value != 0 && msg.sender == expectedAddress, BaseErrors.called_not_from_pool_participant);
        uint128 userSulpur = math.muldiv(userDeposit, totalRaised - math.min(totalRaised, hardCap), totalRaised);
        if (userSulpur > 0) {
            totalReturned += userSulpur;
            emit SurplusDepositReturned(user, userSulpur);
            ILaunchPoolParticipationCallback(user).depositSulpurReturnedCallback{value: 1, flag: 1, bounce: false}(callbackId);
        }
        tvm.rawReserve(totalRaised - totalReturned - totalWithdraw + LaunchPoolGas.INITIAL_BALANCE, 0);
        user.transfer(0, false, 128);
    }

    function processReturnDeposit(
        uint128 userDeposit,
        address user,
        uint32 callbackId
    ) override external onlyState(ILaunchPool.LaunchPoolStatus.Failed) {
        address expectedAddress = getLaunchPoolParticipationAddress(user);
        require(msg.sender.value != 0 && msg.sender == expectedAddress, BaseErrors.called_not_from_pool_participant);
        if (userDeposit > 0) {
            totalReturned += userDeposit;
            emit DepositReturned(user, userDeposit);
            ILaunchPoolParticipationCallback(user).depositReturnedCallback{value: 1, flag: 1, bounce: false}(callbackId);
        }
        tvm.rawReserve(totalRaised - totalReturned - totalWithdraw + LaunchPoolGas.INITIAL_BALANCE, 0);
        user.transfer(0, false, 128);
    }

    function processClaimReward(
        uint32 claimFrom,
        uint32 claimTo,
        uint128 userDeposit,
        address user,
        uint32 callbackId
    ) override external onlyState(ILaunchPool.LaunchPoolStatus.Complete) {
        address expectedAddress = getLaunchPoolParticipationAddress(user);
        require(msg.sender.value != 0 && msg.sender == expectedAddress, BaseErrors.called_not_from_pool_participant);
        tvm.rawReserve(totalRaised - totalReturned - totalWithdraw + LaunchPoolGas.INITIAL_BALANCE, 0);
        uint128 sumPercent = 0;
        uint128 userFullAllocation = math.muldiv(tokensSupply, userDeposit, totalRaised);
        for (VestingPeriod period : vestingPeriods) {
            if (period.unfreezeTime > claimFrom && period.unfreezeTime <= claimTo) {
                sumPercent += period.percent;
            }
        }
        if (sumPercent > 0) {
            uint128 sum = math.muldiv(userFullAllocation, sumPercent, 10000);
            emit ClaimRewarded(user, sum);
            ILaunchPoolParticipationCallback(user).claimRewardedCallback{value: 1, flag: 1, bounce: false}(callbackId);
            TvmCell empty;
            ITokenWallet(tokenWallet).transfer{ value: 0, flag: 128 } (
                sum,
                user,
                LaunchPoolGas.DEPLOY_WALLET_GRAMS,
                user,
                false,
                empty
            );
        } else {
            user.transfer(0, false, 128);
        }
    }
    
    function buildBridgeLayer3Payload(uint128 _gasForUser, uint32 _callbackId) external pure returns (TvmCell) {
        TvmBuilder builder;
        builder.store(_gasForUser, _callbackId);
        return builder.toCell();
    }
    
    function buildCallbackIdPayload(uint32 _callbackId) external pure returns (TvmCell) {
        TvmBuilder builder;
        builder.store(_callbackId);
        return builder.toCell();
    }

    function getCallbackIdFromPayload(TvmCell _payload) private pure returns (uint32) {
        uint32 callbackId = 404;
        if (_payload.toSlice().bits() >= 32) {
            callbackId = _payload.toSlice().decode(uint32);
        }
        return callbackId;
    }

    // callbacks

    function onAcceptTokensTransfer(
        address tokenRoot,
        uint128 amount,
        address sender,
        address senderWallet,
        address remainingGasTo,
        TvmCell payload
    ) override external {
        require (msg.sender.value != 0 && msg.sender == tokenWallet, BaseErrors.called_not_from_token_wallet);
        tvm.rawReserve(math.max(address(this).balance - msg.value, LaunchPoolGas.INITIAL_BALANCE), 2);
        if (
            state == ILaunchPool.LaunchPoolStatus.AwaitTokens &&
            sender == owner
        ) {
            tokensSupply = amount;
            state = ILaunchPool.LaunchPoolStatus.Active;
            emit LaunchPoolHasBeenActivated(factory, deployNonce);
            ILaunchPoolCallback(sender).launchPoolHasBeenActivatedCallback{value: 1, flag: 1, bounce: false}(getCallbackIdFromPayload(payload));
            remainingGasTo.transfer(0, false, 128);
        } else {
            ITokenWallet(msg.sender).transfer{value: 0, flag: 128}(
                amount,
                senderWallet,
                0,
                remainingGasTo,
                true,
                payload
            );
        }
    }

    function onDepositIncreased(uint32 _depositNonce) override external {
        tvm.rawReserve(totalRaised - totalReturned - totalWithdraw + LaunchPoolGas.INITIAL_BALANCE, 0);
        PendingDeposit deposit = deposits[_depositNonce];
        address expectedAddr = getLaunchPoolParticipationAddress(deposit.user);
        require (msg.sender.value != 0 && msg.sender == expectedAddr, BaseErrors.called_not_from_pool_participant);
        emit NewInvestment(expectedAddr, deposit.user, deposit.amount);
        ILaunchPoolCallback(deposit.user).newInvestmentCallback{value: 1, flag: 1, bounce: false}(404);
        delete deposits[_depositNonce];
        deposit.sendGasTo.transfer(0, false, 128);
    }

    function onTokenWallet(address value) external {
        require(msg.sender.value != 0 && msg.sender == launchTokenRoot, BaseErrors.forbidden);
        tvm.rawReserve(LaunchPoolGas.INITIAL_BALANCE, 0);
        tokenWallet = value;
        state = ILaunchPool.LaunchPoolStatus.AwaitTokens;
        emit launchPoolAwaitTokensCallback(factory, deployNonce);
        ILaunchPoolCallback(owner).launchPoolAwaitTokensCallback{value: 1, flag: 1, bounce: false}(404);
        owner.transfer(0, false, 128);
    }

    onBounce(TvmSlice slice) external {
        uint32 functionId = slice.decode(uint32);
        if (functionId == tvm.functionId(LaunchPoolParticipation.increaseDeposit)) {
            tvm.rawReserve(totalRaised + LaunchPoolGas.INITIAL_BALANCE, 0);
            uint32 _depositNonce = slice.decode(uint32);
            PendingDeposit deposit = deposits[_depositNonce];
            amountOfInvestors++;
            address launchPoolParticipationAddress = deployLaunchPoolParticipation(deposit.user);
            ILaunchPoolParticipation(launchPoolParticipationAddress).increaseDeposit{value: 0, flag: 128}(_depositNonce, deposit.amount);
        }
    }
}
