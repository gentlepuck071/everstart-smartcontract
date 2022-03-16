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
  const LaunchPoolFactory = await locklift.factory.getContract('LaunchPoolFactory');
  const LaunchPool = await locklift.factory.getContract('LaunchPool');
  const LaunchPoolParticipation = await locklift.factory.getContract('LaunchPoolParticipation');
  const [keyPair] = await locklift.keys.getKeyPairs();

  let launchPoolFactory;
  if (locklift.network === 'local') {
    const account = migration.load(await locklift.factory.getAccount('Wallet', 'scripts/builds'), 'Account', locklift.network);
    launchPoolFactory = await locklift.giver.deployContract({
      contract: LaunchPoolFactory,
      constructorParams: {
        _owner: account.address,
        _sendGasTo: account.address,
      },
      initParams: {
        deploySeed: locklift.utils.getRandomNonce(),
        launchPoolParticipationCode: LaunchPoolParticipation.code,
        launchPoolCode: LaunchPool.code,
      },
      keyPair,
      value: locklift.utils.convertCrystal(6, 'nano'),
    });
  } else {
    if (!options.nonce) {
      console.log('You should pass nonce parameter when using not a local network!')
      console.log('locklift run --config locklift.config.js --network mainnet --script scripts/1-deploy-launch-pool-factory.js -N 54672')
      return;
    }
    const account = migration.load(await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds'), 'Account', locklift.network);
    launchPoolFactory = await deployContract({
      contract: LaunchPoolFactory,
      constructorParams: {
        _owner: account.address,
        _sendGasTo: account.address,
      },
      initParams: {
        deploySeed: options.nonce,
        launchPoolParticipationCode: LaunchPoolParticipation.code,
        launchPoolCode: LaunchPool.code,
      },
      keyPair,
      gramsAccount: account,
      gramsAmount: locklift.utils.convertCrystal(5, 'nano'),
    });
  }
  migration.store(launchPoolFactory, 'LaunchPoolFactory', locklift.network);
  migration.saveCommand(locklift.network, program, { launchPoolFactoryAddress: launchPoolFactory.address });
  console.log(`LaunchPoolFactory: ${launchPoolFactory.address}`)
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
