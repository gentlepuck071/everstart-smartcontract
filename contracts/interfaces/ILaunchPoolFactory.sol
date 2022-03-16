pragma ton-solidity ^0.57.1;
pragma AbiHeader expire;

interface ILaunchPoolFactory {
    event NewLaunchPool(
        address pool,
        uint64 poolDeployNonce,
        address poolOwner
    );

    function onPoolDeploy(
        uint64 poolDeployNonce,
        address poolOwner,
        address sendGasTo
    ) external;
}
