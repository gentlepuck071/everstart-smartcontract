const { Migration } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-lp_plN, --poolNumber <poolNumber>', 'number of new poll (temporary option)')
program.parse(process.argv);
const options = program.opts();

async function main() {
  const launchPoolFactory = migration.load(await locklift.factory.getContract('LaunchPoolFactory'), 'LaunchPoolFactory', locklift.network);

  if (!options.poolNumber) {
    console.log('You should pass all parameters!')
    console.log(`locklift run --config locklift.config.js --network mainnet --script scripts/3.5-get-launch-pool-address.js -lp_plN 0`);
    return;
  }
  const address = await launchPoolFactory.call({
    method: 'getLaunchPoolAddress',
    params: {
      poolNumber: options.poolNumber,
    }
  });
  console.log(`LaunchPool_${options.poolNumber}: ${address}`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
