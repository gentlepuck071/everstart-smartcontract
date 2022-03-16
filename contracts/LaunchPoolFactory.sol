pragma ton-solidity ^0.57.1;
pragma AbiHeader expire;

import "./LaunchPool.sol";

import "./errors/BaseErrors.sol";
import "./errors/LaunchPoolFactoryErrors.sol";
import "./libraries/gas/LaunchPoolFactoryGas.sol";

import "./access/InternalOwner.sol";

import "./interfaces/ILaunchPoolFactory.sol";
import "./interfaces/ILaunchPool.sol";
import "./interfaces/INumeratorDenominatorStructure.sol";

contract LaunchPoolFactory is InternalOwner, ILaunchPoolFactory {

    TvmCell static launchPoolParticipationCode;
    TvmCell static launchPoolCode;
    uint128 static deploySeed;
    
    uint64 public poolsCount;
    uint32 public version;

    constructor(
        address _owner,
        address _sendGasTo
    ) public {
        require (tvm.pubkey() == msg.pubkey(), BaseErrors.called_with_wrong_pubkey);
        tvm.accept();
        tvm.rawReserve(LaunchPoolFactoryGas.INITIAL_BALANCE, 0);
        owner = _owner;
        poolsCount = 0;
        _sendGasTo.transfer({ value: 0, flag: 128, bounce: false });
    }

    function deployLaunchPool(
        address _poolOwner,
        address _launchTokenRoot,
        uint32 _startTime,
        uint32 _endTime,
        ILaunchPool.VestingPeriod[] _vestingPeriods,
        uint128 _softCap,
        uint128 _hardCap,
        address _sendGasTo,
        ILaunchPool.AdditionalProjectInfo _additionalProjectInfo
    ) public onlyOwner {
        require(msg.value >= LaunchPoolFactoryGas.LAUNCH_POOL_DEPLOY_VALUE, LaunchPoolFactoryErrors.low_pool_deploy_value);
        tvm.rawReserve(math.max(address(this).balance - msg.value, LaunchPoolFactoryGas.INITIAL_BALANCE), 2);

        TvmCell stateInit = tvm.buildStateInit({
            contr: LaunchPool,
            varInit: {
                launchPoolParticipationCode: launchPoolParticipationCode,
                deployNonce: poolsCount++,
                factory: address(this)
            },
            code: launchPoolCode
        });

        new LaunchPool{
            stateInit: stateInit,
            value: 0,
            wid: address(this).wid,
            flag: 128
        }(
            _poolOwner, _launchTokenRoot, _startTime, _endTime, _vestingPeriods, _softCap, _hardCap,
            _sendGasTo, _additionalProjectInfo
        );
    }

    function onPoolDeploy(
        uint64 poolDeployNonce,
        address poolOwner,
        address sendGasTo
    ) external override {
        TvmCell stateInit = tvm.buildStateInit({
            contr: LaunchPool,
            varInit: {
                launchPoolParticipationCode: launchPoolParticipationCode,
                deployNonce: poolDeployNonce,
                factory: address(this)
            },
            code: launchPoolCode
        });
        address pool_address = address(tvm.hash(stateInit));
        require (msg.sender == pool_address, BaseErrors.called_not_from_pool);
        tvm.rawReserve(math.max(address(this).balance - msg.value, LaunchPoolFactoryGas.INITIAL_BALANCE), 2);
        emit NewLaunchPool(pool_address, poolDeployNonce, poolOwner);
        sendGasTo.transfer({ value: 0, flag: 128, bounce: false });
    }

    function getLaunchPoolAddress(
        uint32 poolNumber
    ) public view returns (address) {
        TvmCell stateInit = tvm.buildStateInit({
            contr: LaunchPool,
            varInit: {
                launchPoolParticipationCode: launchPoolParticipationCode,
                deployNonce: poolNumber,
                factory: address(this)
            },
            code: launchPoolCode
        });
        return address(tvm.hash(stateInit));
    }

    // Function that changes the code of current contract.
	function setCode(TvmCell newCode, address sendGasTo) public onlyOwner {
        // Creates a "check point" of the state variables (by copying them from c7 to c4) and register c5.
        // If the contract throws an exception at the computing phase then the state variables and register c5 will roll back to the "check point", 
        // and the computing phase will be considered "successful". If contract doesn't throw an exception, it has no effect.
        tvm.commit();
		// Runtime function that creates an output action that would change this
		// smart contract code to that given by cell newCode.
		tvm.setcode(newCode);
		// Runtime function that replaces current code of the contract with newCode.
		tvm.setCurrentCode(newCode);
		// Call function onCodeUpgrade of the 'new' code.
		onCodeUpgrade(sendGasTo);
	}

    // After code upgrade caused by calling setCode function we may need to do some actions.
	// We can add them into this function with constant id.
	function onCodeUpgrade(address sendGasTo) private {
        tvm.rawReserve(LaunchPoolFactoryGas.INITIAL_BALANCE, 0);
		version++;
        sendGasTo.transfer({ value: 0, flag: 128, bounce: false });
	}
}