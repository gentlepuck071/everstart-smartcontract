const { Migration } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-lP, --launchPool <launchPool>', 'LaunchPool address')
  .option('-oA, --ownerAddress <ownerAddress>', 'Blockchain address of account')
  .option('-oP, --ownerKeyPhrase <ownerKeyPhrase>', 'array of string (JSON string)')
program.parse(process.argv);
const options = program.opts();

async function main() {
  if (!options.launchPool || !options.tokenAmount || !options.ownerAddress || !options.ownerKeyPhrase) {
    console.log('You should all parameters!');
    console.log(`
      locklift run --config locklift.config.js --network mainnet --script scripts/10.5-withdraw-tokens.js \
      -lP 0:864920505c623c5b236d6e5b2f6c696f15c2682de3182379e34631264210b942 \
      -oA 0:7dc99202fe9fe0d4f588c8a50bfe82b383d7e19f94db49db949cc35dd76c639a \
      -oP '["explain","level","rapid","rapid","rapid","rapid","rapid","joke","cross","receive","hip","bridge"]'
    `);
    return;
  }
  const launchPool = await locklift.factory.getContract('LaunchPool');
  launchPool.setAddress(options.launchPool);
  const account = locklift.network === 'local'
    ? await locklift.factory.getAccount('Wallet', 'scripts/builds')
    : await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds');
  account.setAddress(options.ownerAddress);
  
  const tx = await account.runTarget({
    contract: launchPool,
    method: 'withdrawTokens',
    params: {
      sendGasTo: options.ownerAddress,
      to: account.address,
    },
    keyPair: await locklift.ton.client.crypto.mnemonic_derive_sign_keys({
      wordCount: JSON.parse(options.ownerKeyPhrase).length,
      phrase: JSON.parse(options.ownerKeyPhrase).join(' '),
    }),
    value: locklift.utils.convertCrystal(1, 'nano'),
  });
  migration.saveCommand(locklift.network, program, { txHash: tx.transaction.id });
  console.log(`Tokens taken away`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
