const { Migration } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
program.parse(process.argv);

async function main() {
  const launchPoolFactory = migration.load(await locklift.factory.getContract('LaunchPoolFactory'), 'LaunchPoolFactory', locklift.network);
  const account = locklift.network === 'local'
    ? migration.load(await locklift.factory.getAccount('Wallet', 'scripts/builds'), 'Account', locklift.network)
    : migration.load(await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds'), 'Account', locklift.network);
  const [keyPair] = await locklift.keys.getKeyPairs();
  
  const tx = await account.runTarget({
    contract: launchPoolFactory,
    method: 'setCode',
    params: {
      newCode: launchPoolFactory.code,
      sendGasTo: account.address
    },
    keyPair,
    value: locklift.utils.convertCrystal(1, 'nano'),
  });
  migration.saveCommand(locklift.network, program, { txHash: tx.transaction.id });
  console.log(`Code of launch pool factory has been upgraded`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
