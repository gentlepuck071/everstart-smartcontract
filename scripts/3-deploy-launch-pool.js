const { Migration } = require(process.cwd()+'/scripts/utils');
const { Command } = require('commander');
const program = new Command();

const migration = new Migration();

program
  .allowUnknownOption()
  .option('-lp_o, --poolOwnerAddress <poolOwnerAddress>', 'Blockchain address of account')
  .option('-lp_t, --tokenRoot <tokenRoot>', 'Blockchain address of token')
  .option('-lp_sT, --startTime <startTime>', 'start time of launch pool (Timestamp)')
  .option('-lp_eT, --endTime <endTime>', 'end time of launch pool (Timestamp)')
  .option('-lp_v, --vestingPeriods <vestingPeriods>', 'array of object {unfreezeTime: <Timestamp>, percent: <integer from 1 to 10000>} (JSON string)')
  .option('-lp_sC, --softCap <softCap>', 'softCap (nano ever)')
  .option('-lp_hC, --hardCap <hardCap>', 'hardCap (nano ever)')
  .option('-lp_aPI, --additionalProjectInfo <additionalProjectInfo>', `object {
    projectName: string,
    projectDescription: string,
    projectImageUrl: string,
    projectLandingUrl: string,
    projectSocialLinks: [{ name: string, link: string }]
   } (JSON string)`)
  .option('-lp_plN, --poolNumber <poolNumber>', 'number of new poll (temporary option)')
program.parse(process.argv);
const options = program.opts();

async function main() {
  const account = locklift.network === 'local'
    ? migration.load(await locklift.factory.getAccount('Wallet', 'scripts/builds'), 'Account', locklift.network)
    : migration.load(await locklift.factory.getAccount('SafeMultisigWallet', 'scripts/builds'), 'Account', locklift.network);
  const launchPoolFactory = migration.load(await locklift.factory.getContract('LaunchPoolFactory'), 'LaunchPoolFactory', locklift.network);
  const launchPool = await locklift.factory.getContract('LaunchPool');
  const [keyPair] = await locklift.keys.getKeyPairs();

  if (
    !options.poolOwnerAddress ||
    !options.tokenRoot ||
    !options.startTime ||
    !options.endTime ||
    !options.vestingPeriods ||
    !options.softCap ||
    !options.hardCap ||
    !options.additionalProjectInfo ||
    !options.poolNumber
  ) {
    console.log('You should pass all parameters!')
    console.log(`
      locklift run --config locklift.config.js --network local --script scripts/3-deploy-launch-pool.js \
      -lp_o 0:b1c35811f13dccc8b6422ee57ce6cec4c10b896ad1374a93f3b3d0ebd77f8d1c \
      -lp_t 0:396cac3dc43bcfa3cb3762851e686a6f5fdef6c2d31473b1acfc48b32fbd0f7b \
      -lp_sT 1637200000 \
      -lp_eT 1637400000 \
      -lp_v "[{\"unfreezeTime\":1637400000,\"percent\":10000}]" \
      -lp_sC 1000000000 \
      -lp_hC 10000000000 \
      -lp_aPI "{\"projectName\":\"projectName\",\"projectDescription\":\"projectDescription\",\"projectImageUrl\":\"projectImageUrl\",\"projectLandingUrl\":\"projectLandingUrl\",\"projectSocialLinks\":[{\"name\":\"linkName\",\"link\":\"projectSocialLinks\"}]}" \
      -lp_plN 0
    `);
    return;
  }

  await account.runTarget({
    contract: launchPoolFactory,
    method: 'deployLaunchPool',
    params: {
      _poolOwner: options.poolOwnerAddress,
      _launchTokenRoot: options.tokenRoot,
      _startTime: Number(options.startTime),
      _endTime: Number(options.endTime),
      _vestingPeriods: JSON.parse(options.vestingPeriods),
      _softCap: options.softCap,
      _hardCap: options.hardCap,
      _sendGasTo: account.address,
      // _projectName: options.projectName,
      // _projectDescription: options.projectDescription,
      // _projectImageUrl: options.projectImageUrl,
      // _projectLandingUrl: options.projectLandingUrl,
      // _projectSocialLinks: JSON.parse(options.projectSocialLinks),
      _additionalProjectInfo: JSON.parse(options.additionalProjectInfo)
    },
    keyPair,
    value: locklift.utils.convertCrystal(10, 'nano'),
  });
  launchPool.setAddress(await launchPoolFactory.call({
    method: 'getLaunchPoolAddress',
    params: {
      poolNumber: options.poolNumber,
    }
  }));
  migration.store(launchPool, `LaunchPool_${options.poolNumber}`, locklift.network);
  migration.saveCommand(locklift.network, program, { launchPoolAddress: launchPool.address });
  console.log(`LaunchPool_${options.poolNumber}: ${launchPool.address}`);
}

main()
.then(() => process.exit(0))
.catch(e => {
  console.log(e);
  process.exit(1);
});
