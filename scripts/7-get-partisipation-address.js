const { Command } = require('commander');
const program = new Command();

program
  .allowUnknownOption()
  .option('-lP, --launchPool <launchPool>', 'LaunchPool address')
  .option('-iA, --investorAddress <investorAddress>', 'Address of investor')
program.parse(process.argv);
const options = program.opts();

async function main() {
  if (!options.launchPool || !options.investorAddress) {
    console.log('You should all parameters!');
    console.log(`
      locklift run --config locklift.config.js --network mainnet --script scripts/7-get-partisipation-address.js \
      -lP 0:864920505c623c5b236d6e5b2f6c696f15c2682de3182379e34631264210b942 \
      -iA 0:82e69c18032670a074c079185d500363f3a8ae3403a34ed5405c8aace8876bad
    `);
    return;
  }

  const launchPool = await locklift.factory.getContract('LaunchPool');
  launchPool.setAddress(options.launchPool);

  const launchPoolParticipationAddress = await launchPool.call({
    method: 'getLaunchPoolParticipationAddress',
    params: {
      _user: options.investorAddress,
    }
  });
  console.log(`LaunchPoolParticipationAddress: ${launchPoolParticipationAddress}`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
