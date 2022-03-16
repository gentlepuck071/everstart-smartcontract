pragma ton-solidity ^0.57.1;

library BaseErrors {
    // callee cases
    uint8 constant called_with_wrong_pubkey         = 101;
    uint8 constant called_not_from_owner            = 102;
    uint8 constant called_not_from_pool             = 103;
    uint8 constant called_not_from_fabric           = 104;
    uint8 constant called_not_from_pool_participant = 105;
    uint8 constant called_not_from_token_wallet     = 106;
    uint8 constant forbidden                        = 107;
}