pragma ton-solidity ^0.57.1;

import "./ICreditEventDataStructure.sol";

interface IReceiveTONsFromBridgeCallback is ICreditEventDataStructure {
    function onReceiveTONsFromBridgeCallback(CreditEventData decodedEventData) external;
}
