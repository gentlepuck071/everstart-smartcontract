const { Migration } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-rT, --rootToken <rootToken>', 'Token address')
  .option('-tA, --tokenAmount <tokenAmount>', 'Token amount')
  .option('-wO, --walletOwner <walletOwner>', 'Owner address')
program.parse(process.argv);
const options = program.opts();

async function main() {
  const tokenRoot = await locklift.factory.getAccount('TokenRoot', 'scripts/builds');
  tokenRoot.setAddress(options.rootToken);
  const tokenWallet = await locklift.factory.getAccount('TokenWallet', 'scripts/builds');
  const [keyPair] = await locklift.keys.getKeyPairs();

  if (!options.rootToken || !options.tokenAmount || !options.walletOwner) {
    console.log('You should all parameters!');
    console.log(`
      locklift run --config locklift.config.js --network mainnet --script scripts/4-deploy-token-wallet-with-mint.js \
      -rT 0:6a94ca557fb6ea22295e344c8eb2aa7383af856a9d193d70f532c44f47c9f0b2 \
      -tA 1000000 \
      -wO 0:7dc99202fe9fe0d4f588c8a50bfe82b383d7e19f94db49db949cc35dd76c639a
    `);
    return;
  }
  const account = locklift.network === 'local'
    ? migration.load(await locklift.factory.getAccount('Wallet', 'scripts/builds'), 'Account', locklift.network)
    : migration.load(await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds'), 'Account', locklift.network);
  await account.runTarget({
    contract: tokenRoot,
    method: 'deployWallet',
    params: {
      answerId: 404,
      walletOwner: options.walletOwner,
      deployWalletValue: locklift.utils.convertCrystal(1, 'nano')
    },
    keyPair,
  }, locklift.utils.convertCrystal(1, 'nano'));
  await account.runTarget({
    contract: tokenRoot,
    method: 'mint',
    params: {
      amount: options.tokenAmount,
      recipient: options.walletOwner,
      deployWalletValue: 0,
      remainingGasTo: account.address,
      notify: false,
      payload: ''
    },
    keyPair,
    value: locklift.utils.convertCrystal(1, 'nano'),
  });
  tokenWallet.setAddress(await tokenRoot.call({
    method: 'walletOf',
    params: {
      walletOwner: options.walletOwner
    }
  }));
  migration.store(tokenWallet, `TokenWallet_for_${options.walletOwner}`, locklift.network);
  migration.saveCommand(locklift.network, program, { tokenWalletAddress: tokenWallet.address });
  console.log(`TokenWallet_for_${options.walletOwner}: ${tokenWallet.address}`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
