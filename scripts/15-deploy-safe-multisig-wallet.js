const { Migration, deployContract, stringToBytesArray } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-O, --owners <owners>', 'Array of custodian keys (JSON string)')
  .option('-R, --reqConfirms <reqConfirms>', 'Default number of confirmations required for executing transaction')
  .option('-G, --generateSeedPhrase [generateSeedPhrase]', 'generate seed phrase')
  .option('-oP, --ownerKeyPhrase <ownerKeyPhrase>', 'array of string (JSON string)')
program.parse(process.argv);
const options = program.opts();

async function main() {
  const account = migration.load(await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds'), 'Account', locklift.network);
  const SafeMultisigWallet = await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds')
  if (!options.owners || !options.reqConfirms || (!options.generateSeedPhrase && !options.ownerKeyPhrase)) {
    console.log('You should pass nonce parameter for Account when using not a local network!')
    console.log(`
    locklift run --config locklift.config.js --network mainnet --script scripts/15-deploy-safe-multisig-wallet.js \
      -O '["0:b1c35811f13dccc8b6422ee57ce6cec4c10b896ad1374a93f3b3d0ebd77f8d1c"]' \
      -R 1 \
      -oP '["explain","level","rapid","rapid","rapid","rapid","rapid","joke","cross","receive","hip","bridge"]'
    `);
    return;
  }
  const seedPhrase = options.generateSeedPhrase
    ? (await locklift.ton.client.crypto.mnemonic_from_random({ dictionary: 1, word_count: 12 })).phrase
    : JSON.parse(options.ownerKeyPhrase).join(' ');
  const safeMultisigWallet = await deployContract({
    contract: SafeMultisigWallet,
    constructorParams: {
      owners: JSON.parse(options.owners).map(x => `0x${x}`),
      reqConfirms: Number(options.reqConfirms)
    },
    keyPair: await locklift.ton.client.crypto.mnemonic_derive_sign_keys({ phrase: seedPhrase }),
    // gramsAccount: account,
    // gramsAmount: locklift.utils.convertCrystal(5, 'nano'),
  });
  migration.saveCommand(locklift.network, program, { seedPhrase, address: safeMultisigWallet.address });
  console.log(`SafeMultisigWallet (Account): ${safeMultisigWallet.address} for ${locklift.network} network`)
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
