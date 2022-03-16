const { Migration, deployContract } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-N, --nonce <nonce>', 'Some random nonce for account deploying')
program.parse(process.argv);
const options = program.opts();

async function main() {
  const Account = await locklift.factory.getAccount('Wallet', 'scripts/builds');
  const [keyPair] = await locklift.keys.getKeyPairs();
  let account;
  if (locklift.network === 'local') {
    account = await locklift.giver.deployContract({
      contract: Account,
      constructorParams: {},
      initParams: {
        _randomNonce: locklift.utils.getRandomNonce(),
      },
      keyPair,
    });
  } else {
    if (!options.nonce) {
      console.log('You should pass nonce parameter for Account when using not a local network!')
      console.log('locklift run --config locklift.config.js --network mainnet --script scripts/0-deploy-account.js -N 54672')
      return;
    }
    account = await deployContract({
      contract: Account,
      constructorParams: {},
      initParams: {
        _randomNonce: options.nonce,
      },
      keyPair,
    });
  }
  migration.store(account, 'Account', locklift.network);
  console.log(`Wallet (Account): ${account.address} for ${locklift.network} network`)
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
