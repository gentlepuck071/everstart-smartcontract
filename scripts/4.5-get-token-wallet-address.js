const { Command } = require('commander');
const program = new Command();


program
  .allowUnknownOption()
  .option('-rT, --rootToken <rootToken>', 'Token amount')
  .option('-wO, --walletOwner <walletOwner>', 'Owner address')
program.parse(process.argv);
const options = program.opts();

async function main() {
  const tokenRoot = await locklift.factory.getAccount('TokenRoot', 'scripts/builds');
  tokenRoot.setAddress(options.rootToken);
  const tokenWallet = await locklift.factory.getAccount('TokenWallet', 'scripts/builds');

  if (!options.rootToken || !options.walletOwner) {
    console.log('You should all parameters!');
    console.log(`
      locklift run --config locklift.config.js --network mainnet --script scripts/4.5-get-token-wallet-address.js \
      -rT 0:6a94ca557fb6ea22295e344c8eb2aa7383af856a9d193d70f532c44f47c9f0b2 \
      -wO 0:7dc99202fe9fe0d4f588c8a50bfe82b383d7e19f94db49db949cc35dd76c639a
    `);
    return;
  }
  const address = await tokenRoot.call({
    method: 'walletOf',
    params: {
      walletOwner: options.walletOwner
    }
  });
  tokenWallet.setAddress(address);
  console.log(`TokenWallet_for_${options.walletOwner}: 
    address: ${address}
  `);
  console.log(` 
    EVERs balance: ${(await locklift.ton.getBalance(tokenWallet.address)).toNumber()}
    tokens balance: ${(await tokenWallet.call({ method: 'balance', params: {}}))}
  `);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
