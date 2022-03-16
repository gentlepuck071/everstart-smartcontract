pragma ton-solidity ^0.57.1;

library LaunchPoolGas {
    uint128 constant INITIAL_BALANCE                                  = 0.5 ever;
    uint128 constant DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE           = 1.2 ever;
    uint128 constant ASSIST_DEPLOY_LAUNCH_POOL_PARTICIPATION_VALUE    = 0.3 ever;
    uint128 constant FABRIC_DEPLOY_CALLBACK_VALUE                     = 0.1 ever;
    uint128 constant DEPLOY_EMPTY_WALLET_VALUE                        = 0.2 ever;
    uint128 constant DEPLOY_EMPTY_WALLET_GRAMS                        = 0.1 ever;
    uint128 constant DEPLOY_WALLET_GRAMS                              = 0.6 ever;
    uint128 constant SET_RECEIVE_CALLBACK_VALUE                       = 0.5 ever;
    uint128 constant GET_TOKEN_WALLET_DETAILS                         = 0.5 ever;
    uint128 constant WITHDRAW_TOKENS_VALUE                            = 0.9 ever;
}