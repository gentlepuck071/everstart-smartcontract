const { Migration } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-fWA, --fromWalletAddress <fromWalletAddress>', 'Wallet address')
  .option('-tAA, --toAccountAddress <toAccountAddress>', 'Wallet address')
  .option('-tA, --tokenAmount <tokenAmount>', 'Token amount')
  .option('-wO, --walletOwner <walletOwner>', 'Address of owner of launchPool and wallet')
  .option('-oP, --ownerKeyPhrase <ownerKeyPhrase>', 'array of string (JSON string)')
program.parse(process.argv);
const options = program.opts();

async function main() {
  if (!options.fromWalletAddress || !options.toAccountAddress || !options.tokenAmount || !options.walletOwner || !options.ownerKeyPhrase) {
    console.log('You should all parameters!');
    console.log(`
      locklift run --config locklift.config.js --network mainnet --script scripts/13-ITokenWallet-transferToRecipient.js \
      -fWA 0:864920505c623c5b236d6e5b2f6c696f15c2682de3182379e34631264210b942 \
      -tAA 0:6a94ca557fb6ea22295e344c8eb2aa7383af856a9d193d70f532c44f47c9f0b2 \
      -tA 10000 \
      -wO 0:7dc99202fe9fe0d4f588c8a50bfe82b383d7e19f94db49db949cc35dd76c639a \
      -oP '["explain","level","rapid","rapid","rapid","rapid","rapid","joke","cross","receive","hip","bridge"]'
    `);
    return;
  }

  const tokenWallet = await locklift.factory.getAccount('TokenWallet', 'scripts/builds');
  tokenWallet.setAddress(options.fromWalletAddress);

  const account = locklift.network === 'local'
    ? await locklift.factory.getAccount('Wallet', 'scripts/builds')
    : await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds');
  account.setAddress(options.walletOwner);

  const tx = await account.runTarget({
    contract: tokenWallet,
    method: 'transfer',
    params: {
      amount: options.tokenAmount,
      recipient: options.toAccountAddress,
      deployWalletValue: locklift.utils.convertCrystal(1.5, 'nano'),
      remainingGasTo: account.address,
      notify: true,
      payload: ''
    },
    keyPair: await locklift.ton.client.crypto.mnemonic_derive_sign_keys({
      wordCount: JSON.parse(options.ownerKeyPhrase).length,
      phrase: JSON.parse(options.ownerKeyPhrase).join(' '),
    }),
    value: locklift.utils.convertCrystal(3, 'nano'),
  });
  migration.saveCommand(locklift.network, program, { txHash: tx.transaction.id });
  console.log(`Sended ${options.tokenAmount} tokens`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
