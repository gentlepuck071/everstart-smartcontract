pragma ton-solidity >= 0.57.1;
pragma AbiHeader expire;
pragma AbiHeader pubkey;


import "./../errors/BaseErrors.sol";


contract InternalOwner {
    address public owner;

    event OwnershipTransferred(address previousOwner, address newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, BaseErrors.called_not_from_owner);
        _;
    }

    /*
        @dev Internal function for setting owner
        Can be used in child contracts
    */
    function setOwnership(address newOwner) internal {
        address oldOwner = owner;

        owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /*
        @dev Transfer ownership to the new owner
    */
    function transferOwnership(
        address newOwner
    ) external onlyOwner {
        require(newOwner != address.makeAddrStd(0, 0), BaseErrors.forbidden);

        setOwnership(newOwner);
    }

    /*
        @dev Renounce ownership. Can't be aborted!
    */
    function renounceOwnership() external onlyOwner {
        address newOwner = address.makeAddrStd(0, 0);

        setOwnership(newOwner);
    }
}
