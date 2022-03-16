pragma ton-solidity ^0.57.1;

import "./INumeratorDenominatorStructure.sol";

interface ICreditEventDataStructure is INumeratorDenominatorStructure {
    struct CreditEventData {
        uint128 amount;
        address user;
        address creditor;
        address recipient;

        uint128 tokenAmount;
        uint128 tonAmount;
        uint8 swapType;
        NumeratorDenominator slippage;

        TvmCell layer3;
    }
}
