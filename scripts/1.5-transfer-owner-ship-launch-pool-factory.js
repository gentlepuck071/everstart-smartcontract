const { Migration } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-OAnew, --newOwnerAddress <newOwnerAddress>', 'new owner address')
  .option('-fA, --factoryAddress <factoryAddress>', 'Address of factory')
  .option('-fO, --factoryOwner <factoryOwner>', 'Address of owner of factory')
  .option('-oP, --ownerKeyPhrase <ownerKeyPhrase>', 'array of string (JSON string)')
program.parse(process.argv);
const options = program.opts();

async function main() {
  if (!options.newOwnerAddress || !options.factoryAddress || !options.factoryOwner || !options.ownerKeyPhrase) {
    console.log('You should all parameters!');
    console.log(`
      locklift run --config locklift.config.js --network mainnet --script scripts/1.5-transfer-owner-ship-launch-pool-factory.js \
      -OAnew 0:6a94ca557fb6ea22295e344c8eb2aa7383af856a9d193d70f532c44f47c9f0b2 \
      -fA 0:d11906e139c134814f9abe203678c512897d61160d1119ffd3a1fbd6c5373401 \
      -fO 0:7dc99202fe9fe0d4f588c8a50bfe82b383d7e19f94db49db949cc35dd76c639a \
      -oP '["ecology","level","rhythm","rapid","tower","life","inherit","joke","cross","receive","hip","bridge"]'
    `);
    return;
  }

  const launchPoolFactory = await locklift.factory.getContract('LaunchPoolFactory');
  launchPoolFactory.setAddress(options.factoryAddress);

  const account = locklift.network === 'local'
    ? await locklift.factory.getAccount('Wallet', 'scripts/builds')
    : await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds');
  account.setAddress(options.factoryOwner);

  const tx = await account.runTarget({
    contract: launchPoolFactory,
    method: 'transferOwnership',
    params: {
      newOwner: options.newOwnerAddress,
    },
    keyPair: await locklift.ton.client.crypto.mnemonic_derive_sign_keys({
      wordCount: JSON.parse(options.ownerKeyPhrase).length,
      phrase: JSON.parse(options.ownerKeyPhrase).join(' '),
    }),
  }, locklift.utils.convertCrystal(1, 'nano'));
  migration.saveCommand(locklift.network, program, {
    oldOwnerAddress: options.factoryOwner,
    newOwnerAddress: options.newOwnerAddress,
  });
  console.log(`Sended owner rules for ${options.rootTokenAddress} LaunchPoolFactory to ${options.newOwnerAddress}`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
