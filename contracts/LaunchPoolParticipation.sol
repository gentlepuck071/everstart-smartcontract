pragma ton-solidity ^0.57.1;
pragma AbiHeader expire;

import "./errors/BaseErrors.sol";
import "./errors/LaunchPoolParticipationErrors.sol";
import "./libraries/gas/LaunchPoolParticipationGas.sol";

import "./access/InternalOwner.sol";

import "./interfaces/ILaunchPool.sol";
import "./interfaces/ILaunchPoolParticipation.sol";

contract LaunchPoolParticipation is InternalOwner, ILaunchPoolParticipation {

    address static launchPool;
    address static user;

    uint128 depositAmount;
    uint32 lastClaim;
    bool sulpurReturned;
    bool depositReturned;

    constructor() public {
        if (msg.sender.value == 0 || msg.sender != launchPool) {
            msg.sender.transfer(0, false, 128 + 32);
        } else {
            tvm.rawReserve(LaunchPoolParticipationGas.INITIAL_BALANCE, 0);
            owner = user;
            lastClaim = 0;
            user.transfer(0, false, 128);
        }
    }

    modifier onlyPool() {
        require(msg.sender.value != 0 && msg.sender == launchPool, BaseErrors.called_not_from_pool);
        _;
    }

    function increaseDeposit(uint32 _depositNonce, uint128 _depositAmount) override external onlyPool {
        tvm.rawReserve(LaunchPoolParticipationGas.INITIAL_BALANCE, 0);
        depositAmount += _depositAmount;
        ILaunchPool(launchPool).onDepositIncreased{value: 0, flag: 128}(_depositNonce);
    }

    function getDetails() external view responsible returns (LaunchPoolParticipationDetails) {
        return { value: 0, bounce: false, flag: 64 }ILaunchPoolParticipation.LaunchPoolParticipationDetails(
            launchPool, user, depositAmount, lastClaim, sulpurReturned, depositReturned
        );
    }

    function claimReward(uint32 callbackId) external onlyOwner {
        require(msg.value > LaunchPoolParticipationGas.CLAIM_REWARD_VALUE, LaunchPoolParticipationErrors.low_claim_reward_value);
        uint32 lastClaimBuff = lastClaim;
        lastClaim = now;
        tvm.rawReserve(LaunchPoolParticipationGas.INITIAL_BALANCE, 0);
        ILaunchPool(launchPool).processClaimReward{value: 0, flag: 128}(lastClaimBuff, lastClaim, depositAmount, user, callbackId);
    }

    function returnDepositSulpur(uint32 callbackId) external onlyOwner {
        require(!sulpurReturned, LaunchPoolParticipationErrors.sulpur_already_returned);
        require(msg.value > LaunchPoolParticipationGas.RETURN_SULPUR_VALUE, LaunchPoolParticipationErrors.low_return_sulpur_value);
        tvm.rawReserve(LaunchPoolParticipationGas.INITIAL_BALANCE, 0);
        sulpurReturned = true;
        ILaunchPool(launchPool).processReturnDepositSulpur{value: 0, flag: 128}(depositAmount, user, callbackId);
    }

    function returnDeposit(uint32 callbackId) external onlyOwner {
        require(!depositReturned, LaunchPoolParticipationErrors.deposit_already_returned);
        require(msg.value > LaunchPoolParticipationGas.RETURN_DEPOSIT_VALUE, LaunchPoolParticipationErrors.low_return_deposit_value);
        tvm.rawReserve(LaunchPoolParticipationGas.INITIAL_BALANCE, 0);
        depositReturned = true;
        ILaunchPool(launchPool).processReturnDeposit{value: 0, flag: 128}(depositAmount, user, callbackId);
    }

    onBounce(TvmSlice slice) external {
        uint32 functionId = slice.decode(uint32);
        if (functionId == tvm.functionId(ILaunchPool.processClaimReward) && msg.sender == launchPool) {
            tvm.rawReserve(LaunchPoolParticipationGas.INITIAL_BALANCE, 0);
            lastClaim = slice.decode(uint32);
            user.transfer(0, false, 128);
        }
        if (functionId == tvm.functionId(ILaunchPool.processReturnDepositSulpur) && msg.sender == launchPool) {
            tvm.rawReserve(LaunchPoolParticipationGas.INITIAL_BALANCE, 0);
            sulpurReturned = false;
            user.transfer(0, false, 128);
        }
        if (functionId == tvm.functionId(ILaunchPool.processReturnDeposit) && msg.sender == launchPool) {
            tvm.rawReserve(LaunchPoolParticipationGas.INITIAL_BALANCE, 0);
            depositReturned = false;
            user.transfer(0, false, 128);
        }
    }
}
