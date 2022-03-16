const stringToBytesArray = (dataString) => {
  return Buffer.from(dataString).toString('hex')
};

async function deployAccount() {
  const Account = await locklift.factory.getAccount('Wallet', 'scripts/builds');
  const keyPairs = await locklift.keys.getKeyPairs();
  const account = await locklift.giver.deployContract({
    contract: Account,
    constructorParams: {},
    initParams: {
      _randomNonce: locklift.utils.getRandomNonce(),
    },
    keyPair: keyPairs[0],
  }, locklift.utils.convertCrystal(100, 'nano'));
  return account
}

/**
 * 
 * @param {String} params.owner 
 * @param {String|undefined} params.name_ default is 'FooToken'
 * @param {String|undefined} params.symbol_ default is 'FOO'
 * @param {Number|undefined} params.decimals_ default is 0
 * @param {String|undefined} params.initialSupplyTo default is locklift.utils.zeroAddress
 * @param {Number|undefined} params.initialSupply default is 0
 * @param {Number|undefined} params.deployWalletValue default is 0
 * @param {Boolean|undefined} params.mintDisabled default is false
 * @param {Boolean|undefined} params.burnByRootDisabled default is false
 * @param {Boolean|undefined} params.burnPaused default is false
 * @param {String|undefined} params.remainingGasTo default is owner
 * @param {String|undefined} params.amountOfGas default is locklift.utils.convertCrystal(10, 'nano')
 * @returns {TokenRoot}
 */
async function deployTokenRoot(params) {
  const TokenRoot = await locklift.factory.getAccount('TokenRoot', 'scripts/builds');
  const TokenWallet = await locklift.factory.getAccount('TokenWallet', 'scripts/builds');
  const keyPairs = await locklift.keys.getKeyPairs();
  const tokenRoot = await locklift.giver.deployContract({
    contract: TokenRoot,
    constructorParams: {
      initialSupplyTo: params.initialSupplyTo || locklift.utils.zeroAddress,
      initialSupply: params.initialSupply || 0,
      deployWalletValue: params.deployWalletValue || 0,
      mintDisabled: params.mintDisabled || false,
      burnByRootDisabled: params.burnByRootDisabled || false,
      burnPaused: params.burnPaused || false,
      remainingGasTo: params.remainingGasTo || params.owner
    },
    initParams: {
      name_: stringToBytesArray(params.name_ || 'FooToken'),
      symbol_: stringToBytesArray(params.symbol_ || 'FOO'),
      decimals_: params.decimals_ || 0,
      rootOwner_: params.owner,
      walletCode_: TokenWallet.code,
      randomNonce_: locklift.utils.getRandomNonce(),
      deployer_: locklift.utils.zeroAddress,
    },
    keyPair: keyPairs[0],
  }, params.amountOfGas || locklift.utils.convertCrystal(100, 'nano'));
  return tokenRoot;
}

/**
 * 
 * @param {String} params.rootOwner 
 * @param {String} params.tokenRoot 
 * @param {String} params.walletOwner 
 * @param {String|undefined} params.answerId default is 404
 * @param {String|undefined} params.deployWalletValue default is locklift.utils.convertCrystal(1, 'nano')
 * @param {String|undefined} params.amountOfGas default is locklift.utils.convertCrystal(10, 'nano')
 * @returns {TokenWallet}
 */
const deployTokenWallet = async (_params) => {
  const keyPairs = await locklift.keys.getKeyPairs();
  await _params.rootOwner.runTarget({
    contract: _params.tokenRoot,
    method: 'deployWallet',
    params: {
      answerId: _params.answerId || 404,
      walletOwner: _params.walletOwner,
      deployWalletValue: _params.deployWalletValue || locklift.utils.convertCrystal(1, 'nano')
    },
    keyPair: keyPairs[0],
    value: _params.amountOfGas || locklift.utils.convertCrystal(10, 'nano'),
  });
  const walletAddress = await _params.tokenRoot.call({
    method: 'walletOf',
    params: {
      walletOwner: _params.walletOwner
    }
  });
  const wallet = await locklift.factory.getAccount('TokenWallet', 'scripts/builds');
  wallet.setAddress(walletAddress);
  return wallet;
}

/**
 * 
 * @param {String} params.rootOwner 
 * @param {String} params.tokenRoot 
 * @param {String} params.amount in nano
 * @param {String} params.recipient 
 * @param {String|undefined} params.deployWalletValue in nano; default is 0
 * @param {String|undefined} params.remainingGasTo default is rootOwner
 * @param {Boolean|undefined} params.notify default is false
 * @param {String|undefined} params.payload default is ''
 * @param {String|undefined} params.amountOfGas default is locklift.utils.convertCrystal(10, 'nano')
 * @returns {TokenWallet}
 */
const mintTokens = async (_params) => {
  const keyPairs = await locklift.keys.getKeyPairs();
  await _params.rootOwner.runTarget({
    contract: _params.tokenRoot,
    method: 'mint',
    params: {
      amount: _params.amount,
      recipient: _params.recipient,
      deployWalletValue: _params.deployWalletValue || 0,
      remainingGasTo: _params.remainingGasTo || _params.rootOwner.address,
      notify: _params.notify || false,
      payload: _params.payload || ''
    },
    keyPair: keyPairs[0],
    value: _params.amountOfGas || locklift.utils.convertCrystal(10, 'nano'),
  });
  return;
}

module.exports = {
  stringToBytesArray,
  deployAccount,
  deployTokenRoot,
  deployTokenWallet,
  mintTokens
}
