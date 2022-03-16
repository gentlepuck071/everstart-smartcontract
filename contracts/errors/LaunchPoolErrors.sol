pragma ton-solidity ^0.57.1;

library LaunchPoolErrors {
    uint8 constant wrong_state = 201;
    uint8 constant low_withdraw_gas = 202;
    uint8 constant low_deposit_gas = 203;
    uint8 constant depositing_has_not_ended = 204;
    uint8 constant depositing_has_not_started = 205;
    uint8 constant depositing_has_already_been_ended = 206;
    uint8 constant bad_ever_withdrawal_value = 207;
    uint8 constant tokens_not_found = 208;
    uint8 constant low_withdraw_tokens_value = 209;
}