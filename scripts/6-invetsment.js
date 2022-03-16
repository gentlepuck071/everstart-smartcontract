const { Migration } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-lP, --launchPool <launchPool>', 'LaunchPool address')
  .option('-tA, --tokenAmount <tokenAmount>', 'Token amount')
  .option('-iA, --investorAddress <investorAddress>', 'Address of investor')
  .option('-iP, --investorKeyPhrase <investorKeyPhrase>', 'array of string (JSON string)')
program.parse(process.argv);
const options = program.opts();

async function main() {
  if (!options.launchPool || !options.tokenAmount || !options.investorAddress || !options.investorKeyPhrase) {
    console.log('You should all parameters!');
    console.log(`
      locklift run --config locklift.config.js --network mainnet --script scripts/6-invetsment.js \
      -lP 0:864920505c623c5b236d6e5b2f6c696f15c2682de3182379e34631264210b942 \
      -tA 3 \
      -iA 0:82e69c18032670a074c079185d500363f3a8ae3403a34ed5405c8aace8876bad \
      -iP '["explain","level","rapid","rapid","rapid","rapid","rapid","joke","cross","receive","hip","bridge"]'
    `);
    return;
  }

  const launchPool = await locklift.factory.getContract('LaunchPool');
  launchPool.setAddress(options.launchPool);

  const account = locklift.network === 'local'
    ? await locklift.factory.getAccount('Wallet', 'scripts/builds')
    : await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds');
  account.setAddress(options.investorAddress);

  const tx = await account.run({
    method: 'sendTransaction',
    params: {
      dest: launchPool.address,
      value: options.tokenAmount,
      bounce: true,
      flags: 0,
      payload: '',
    },
    keyPair: await locklift.ton.client.crypto.mnemonic_derive_sign_keys({
      wordCount: JSON.parse(options.investorKeyPhrase).length,
      phrase: JSON.parse(options.investorKeyPhrase).join(' '),
    }),
  });
  migration.saveCommand(locklift.network, program, { txHash: tx.transaction.id });
  console.log(`Invested ${options.tokenAmount} nanoEVER`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
