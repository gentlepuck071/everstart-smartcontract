const { Migration } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-lPP, --launchPoolParticipation <launchPoolParticipation>', 'LaunchPoolParticipation address')
  .option('-iA, --investorAddress <investorAddress>', 'Address of investor')
  .option('-iP, --investorKeyPhrase <investorKeyPhrase>', 'array of string (JSON string)')
  .option('-CBI, --callbackId <callbackId>', 'integer')
program.parse(process.argv);
const options = program.opts();

async function main() {
  if (!options.launchPoolParticipation || !options.investorAddress || !options.investorKeyPhrase || !options.callbackId) {
    console.log('You should all parameters!');
    console.log(`
      locklift run --config locklift.config.js --network mainnet --script scripts/11-return-deposit-sulpur.js \
      -lPP 0:75a4ad71ac2c0dca8be687161b614f15bf385e67b2bb80f43c0cb11e204a7f9f \
      -iA 0:82e69c18032670a074c079185d500363f3a8ae3403a34ed5405c8aace8876bad \
      -iP '["explain","level","rapid","rapid","rapid","rapid","rapid","joke","cross","receive","hip","bridge"]' \
      -CBI 1233
    `);
    return;
  }
  const launchPoolParticipation = await locklift.factory.getContract('LaunchPoolParticipation');
  launchPoolParticipation.setAddress(options.launchPoolParticipation);
  const account = locklift.network === 'local'
    ? await locklift.factory.getAccount('Wallet', 'scripts/builds')
    : await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds');
  account.setAddress(options.investorAddress);
  
  const tx = await account.runTarget({
    contract: launchPoolParticipation,
    method: 'returnDepositSulpur',
    params: {
      callbackId: Number(options.callbackId),
    },
    keyPair: await locklift.ton.client.crypto.mnemonic_derive_sign_keys({
      wordCount: JSON.parse(options.investorKeyPhrase).length,
      phrase: JSON.parse(options.investorKeyPhrase).join(' '),
    }),
    value: locklift.utils.convertCrystal(1.2, 'nano'),
  });
  migration.saveCommand(locklift.network, program, { txHash: tx.transaction.id });
  console.log(`Deposit sulpur returned`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
