const { Migration } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-OAnew, --newOwnerAddress <newOwnerAddress>', 'root owner address')
  .option('-rA, --rootTokenAddress <rootTokenAddress>', 'Address of rootToken')
  .option('-rO, --rootTokenOwner <rootTokenOwner>', 'Address of owner of rootToken')
  .option('-oP, --ownerKeyPhrase <ownerKeyPhrase>', 'array of string (JSON string)')
program.parse(process.argv);
const options = program.opts();

async function main() {
  if (!options.newOwnerAddress || !options.rootTokenAddress || !options.rootTokenOwner || !options.ownerKeyPhrase) {
    console.log('You should all parameters!');
    console.log(`
      locklift run --config locklift.config.js --network mainnet --script scripts/2.5-transfer-owner-root-token.js \
      -OAnew 0:6a94ca557fb6ea22295e344c8eb2aa7383af856a9d193d70f532c44f47c9f0b2 \
      -rA 0:d11906e139c134814f9abe203678c512897d61160d1119ffd3a1fbd6c5373401 \
      -rO 0:7dc99202fe9fe0d4f588c8a50bfe82b383d7e19f94db49db949cc35dd76c639a \
      -oP '["explain","level","rapid","rapid","rapid","rapid","rapid","joke","cross","receive","hip","bridge"]'
    `);
    return;
  }

  const tokenRoot = await locklift.factory.getAccount('TokenRoot', 'scripts/builds');
  tokenRoot.setAddress(options.rootTokenAddress);

  const account = locklift.network === 'local'
    ? await locklift.factory.getAccount('Wallet', 'scripts/builds')
    : await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds');
  account.setAddress(options.rootTokenOwner);

  const tx = await account.runTarget({
    contract: tokenRoot,
    method: 'transferOwnership',
    params: {
      newRootOwner: options.newOwnerAddress,
    },
    keyPair: await locklift.ton.client.crypto.mnemonic_derive_sign_keys({
      wordCount: JSON.parse(options.ownerKeyPhrase).length,
      phrase: JSON.parse(options.ownerKeyPhrase).join(' '),
    }),
  }, locklift.utils.convertCrystal(1, 'nano'));
  await new Promise(resolve => setTimeout(resolve, 15000));
  const rootOwner = await tokenRoot.call({
    method: 'rootOwner',
    params: {},
    keyPair: await locklift.ton.client.crypto.mnemonic_derive_sign_keys({
      wordCount: JSON.parse(options.ownerKeyPhrase).length,
      phrase: JSON.parse(options.ownerKeyPhrase).join(' '),
    }),
  });
  console.log(`rootOwner::`, rootOwner);
  migration.saveCommand(locklift.network, program, {
    oldOwnerAddress: options.rootTokenOwner,
    newOwnerAddress: options.newOwnerAddress,
  });
  console.log(`Sended owner rules for ${options.rootTokenAddress} RootToken to ${options.newOwnerAddress}`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
