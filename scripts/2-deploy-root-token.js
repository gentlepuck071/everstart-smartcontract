const { Migration, deployContract, stringToBytesArray } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-N, --name <name>', 'Token name')
  .option('-S, --symbol <symbol>', 'Token symbol')
  .option('-D, --decimals <decimals>', 'Token decimals')
program.parse(process.argv);
const options = program.opts();

async function main() {
  const TokenRoot = await locklift.factory.getAccount('TokenRoot', 'scripts/builds');
  const TokenWallet = await locklift.factory.getAccount('TokenWallet', 'scripts/builds');
  const [keyPair] = await locklift.keys.getKeyPairs();

  let tokenRoot;
  if (locklift.network === 'local') {
    const account = migration.load(await locklift.factory.getAccount('Wallet', 'scripts/builds'), 'Account', locklift.network);
    const randomTokenSymbol = `FOO_${Math.random() * 100000000 | 0}`
    tokenRoot = await locklift.giver.deployContract({
      contract: TokenRoot,
      constructorParams: {
        initialSupplyTo: locklift.utils.zeroAddress,
        initialSupply: 0,
        deployWalletValue: 0,
        mintDisabled: false,
        burnByRootDisabled: false,
        burnPaused: false,
        remainingGasTo: account.address
      },
      initParams: {
        name_: stringToBytesArray(`Token${randomTokenSymbol}`),
        symbol_: stringToBytesArray(randomTokenSymbol),
        decimals_: 0,
        rootOwner_: account.address,
        walletCode_: TokenWallet.code,
        randomNonce_: locklift.utils.getRandomNonce(),
        deployer_: locklift.utils.zeroAddress,
      },
      keyPair,
      value: locklift.utils.convertCrystal(6, 'nano'),
    });
    migration.store(tokenRoot, `RootToken_${randomTokenSymbol}`, locklift.network);
    console.log(`RootToken_${randomTokenSymbol}: ${tokenRoot.address}`)
  } else {
    if (!options.name || !options.symbol || !options.decimals) {
      console.log('You should pass name and symbol parameters for token when using not a local network!')
      console.log('locklift run --config locklift.config.js --network mainnet --script scripts/2-deploy-root-token.js -N FooToken -S FOO -D 0')
      return;
    }
    const account = migration.load(await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds'), 'Account', locklift.network);
    tokenRoot = await deployContract({
      contract: TokenRoot,
      constructorParams: {
        initialSupplyTo: locklift.utils.zeroAddress,
        initialSupply: 0,
        deployWalletValue: 0,
        mintDisabled: false,
        burnByRootDisabled: false,
        burnPaused: false,
        remainingGasTo: account.address
      },
      initParams: {
        name_: stringToBytesArray(options.name),
        symbol_: stringToBytesArray(options.symbol),
        decimals_: Number(options.decimals),
        rootOwner_: account.address,
        walletCode_: TokenWallet.code,
        randomNonce_: locklift.utils.getRandomNonce(),
        deployer_: locklift.utils.zeroAddress,
      },
      keyPair,
      gramsAccount: account,
      gramsAmount: locklift.utils.convertCrystal(2, 'nano'),
    });
    migration.store(tokenRoot, `RootToken_${options.symbol}`, locklift.network);
    migration.saveCommand(locklift.network, program, { rootTokenContractAddress: tokenRoot.address });
    console.log(`RootToken_${options.symbol}: ${tokenRoot.address}`)
  }
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
