const { expect } = require('chai');
const { deployAccount, deployTokenRoot, deployTokenWallet, mintTokens } = require(process.cwd() + '/test/utils');


let LaunchPoolFactory;
let LaunchPool;
let LaunchPoolParticipation;
let launchPoolFactory;
let launchPool;
let launchPoolStartTime;
let launchPoolEndTime;
let vestingPeriods;
let launchPoolParticipation;
let account1;
let account2;
let account3;
let tokenRoot;
let wallet1;
let wallet2;
let wallet3;
let launchPoolWallet;
const supplyAmount = 50;

describe('vestingCase', async function() {
  describe('vestingCase', async function() {
    before(async function() {
      this.timeout(20000);
      account1 = await deployAccount();
      account2 = await deployAccount();
      account3 = await deployAccount();
      tokenRoot = await deployTokenRoot({ owner: account1.address });
      wallet1 = await deployTokenWallet({ rootOwner: account1, tokenRoot, walletOwner: account1.address });
      wallet2 = await deployTokenWallet({ rootOwner: account1, tokenRoot, walletOwner: account2.address });
      wallet3 = await deployTokenWallet({ rootOwner: account1, tokenRoot, walletOwner: account3.address });
      await mintTokens({
        rootOwner: account1,
        tokenRoot,
        recipient: account1.address,
        amount: locklift.utils.convertCrystal(10000, 'nano')
      });
      await mintTokens({
        rootOwner: account1,
        tokenRoot,
        recipient: account2.address,
        amount: locklift.utils.convertCrystal(10000, 'nano')
      });
      await mintTokens({
        rootOwner: account1,
        tokenRoot,
        recipient: account3.address,
        amount: locklift.utils.convertCrystal(10000, 'nano')
      });
    });

    after('info', async function () {
      console.log('account1: ', account1.address, (await locklift.ton.getBalance(account1.address)).toNumber() / 10**9 + " EVER");
      console.log('account2: ', account2.address, (await locklift.ton.getBalance(account2.address)).toNumber() / 10**9 + " EVER");
      console.log('account3: ', account3.address, (await locklift.ton.getBalance(account3.address)).toNumber() / 10**9 + " EVER");
      console.log('wallet1: ',  wallet1.address,
                                (await locklift.ton.getBalance(wallet1.address)).toNumber() / 10**9 + " EVER,",
                                (await wallet1.call({ method: 'balance', params: {}})) + " FOO"
      );
      console.log('wallet2: ',  wallet2.address,
                                (await locklift.ton.getBalance(wallet2.address)).toNumber() / 10**9 + " EVER,",
                                (await wallet2.call({ method: 'balance', params: {}})) + " FOO"
      );
      console.log('wallet3: ',  wallet3.address,
                                (await locklift.ton.getBalance(wallet3.address)).toNumber() / 10**9 + " EVER,",
                                (await wallet3.call({ method: 'balance', params: {}})) + " FOO"
      );
      console.log('launchPoolFactory: ', launchPoolFactory.address, (await locklift.ton.getBalance(launchPoolFactory.address)).toNumber() / 10**9 + " EVER");
      console.log('launchPool: ', launchPool.address, (await locklift.ton.getBalance(launchPool.address)).toNumber() / 10**9 + " EVER");
      console.log('launchPoolWallet: ', launchPoolWallet.address, 
                                        (await locklift.ton.getBalance(launchPoolWallet.address)).toNumber() / 10**9 + " EVER,",
                                        (await launchPoolWallet.call({ method: 'balance', params: {}})) + " FOO"
      );
      console.log('launchPoolParticipation: ', launchPoolParticipation.address, (await locklift.ton.getBalance(launchPoolParticipation.address)).toNumber() / 10**9 + " EVER");
    })

    it('Load LaunchPoolFactory', async function() {
      LaunchPoolFactory = await locklift.factory.getContract('LaunchPoolFactory');
      
      expect(LaunchPoolFactory.code).not.to.equal(undefined, 'Code should be available');
      expect(LaunchPoolFactory.abi).not.to.equal(undefined, 'ABI should be available');
    });
    it('Load LaunchPool', async function() {
      LaunchPool = await locklift.factory.getContract('LaunchPool');
      
      expect(LaunchPool.code).not.to.equal(undefined, 'Code should be available');
      expect(LaunchPool.abi).not.to.equal(undefined, 'ABI should be available');
    });
    it('Load LaunchPoolParticipation', async function() {
      LaunchPoolParticipation = await locklift.factory.getContract('LaunchPoolParticipation');
      
      expect(LaunchPoolParticipation.code).not.to.equal(undefined, 'Code should be available');
      expect(LaunchPoolParticipation.abi).not.to.equal(undefined, 'ABI should be available');
    });
    
    it('Deploy LaunchPoolFactory', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();
      
      launchPoolFactory = await locklift.giver.deployContract({
        contract: LaunchPoolFactory,
        constructorParams: {
          _owner: account1.address,
          _sendGasTo: account1.address,
        },
        initParams: {
          deploySeed: locklift.utils.getRandomNonce(),
          launchPoolParticipationCode: LaunchPoolParticipation.code,
          launchPoolCode: LaunchPool.code,
        },
        keyPair,
      }, locklift.utils.convertCrystal(2, 'nano'));
  
      expect(launchPoolFactory.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future address');
    });
    
    it('Deploy LaunchPool', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      launchPoolStartTime = Math.floor(Date.now() / 1000);
      launchPoolEndTime = launchPoolStartTime + 20;
      vestingPeriods = [
        { unfreezeTime: launchPoolEndTime, percent: 3000 },
        { unfreezeTime: launchPoolEndTime + 5, percent: 2000 },
        { unfreezeTime: launchPoolEndTime + 10, percent: 1500 },
        { unfreezeTime: launchPoolEndTime + 15, percent: 3500 },
      ];
      
      await account1.runTarget({
        contract: launchPoolFactory,
        method: 'deployLaunchPool',
        params: {
          _poolOwner: account2.address,
          _launchTokenRoot: tokenRoot.address,
          _startTime: launchPoolStartTime,
          _endTime: launchPoolEndTime,
          _vestingPeriods: vestingPeriods,
          _softCap: locklift.utils.convertCrystal(3, 'nano'),
          _hardCap: locklift.utils.convertCrystal(10, 'nano'),
          _sendGasTo: account1.address,
          _additionalProjectInfo: { 
            projectName: 'projectName',
            projectDescription: 'projectDescription',
            projectImageUrl: 'projectImageUrl',
            projectLandingUrl: 'projectLandingUrl',
            projectSocialLinks: [{name: 'link1', link: 'projectSocialLinks'}],
          }
        },
        keyPair,
        value: locklift.utils.convertCrystal(10, 'nano'),
      });

      const launchPoolAddress = await launchPoolFactory.call({
        method: 'getLaunchPoolAddress',
        params: {
          poolNumber: 0,
        }
      });
      launchPool = await locklift.factory.getContract('LaunchPool');
      launchPool.setAddress(launchPoolAddress);
      expect(launchPool.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future launchPool address');

      const launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });
      launchPoolWallet = await locklift.factory.getAccount('TokenWallet', 'scripts/builds');
      launchPoolWallet.setAddress(launchPoolDetails.tokenWallet);
      expect(launchPoolWallet.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future launchPoolWallet address');
    });

    it('Transfer to launchPoll from owner', async function() {
      this.timeout(20000);
      const [keyPair] = await locklift.keys.getKeyPairs();

      let launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });
      const wallet2BalanceBefore = await wallet2.call({ method: 'balance', params: {}});
      const launchPoolWalletBalanceBefore = await launchPoolWallet.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore.toNumber()).to.eq(0);
  
      await account2.runTarget({
        contract: wallet2,
        method: 'transfer',
        params: {
          amount: supplyAmount,
          recipient: launchPool.address,
          deployWalletValue: 0,
          remainingGasTo: account2.address,
          notify: true,
          payload: ''
        },
        keyPair,
        value: locklift.utils.convertCrystal(2, 'nano'),
      });

      launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });

      const launchPoolWalletBalanceAfter = await launchPoolWallet.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceAfter.toNumber()).to.eq(supplyAmount);
      const wallet2BalanceAfter = await wallet2.call({ method: 'balance', params: {}});
      expect(wallet2BalanceBefore - wallet2BalanceAfter).to.eq(supplyAmount);
    });

    it('Deploy LaunchPoolParticipation (investment)', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      await account3.run({
        method: 'sendTransaction',
        params: {
          dest: launchPool.address,
          value: locklift.utils.convertCrystal(5, 'nano'),
          bounce: true,
          flags: 0,
          payload: '',
        },
        keyPair,
      });
    });
    
    it('Get LaunchPoolParticipation address and details', async function() {
      this.timeout(20000);

      const launchPoolParticipationAddress = await launchPool.call({
        method: 'getLaunchPoolParticipationAddress',
        params: {
          _user: account3.address,
        }
      });
      launchPoolParticipation = await locklift.factory.getContract('LaunchPoolParticipation');
      launchPoolParticipation.setAddress(launchPoolParticipationAddress);

      const launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });
      const launchPoolParticipationDetails = await launchPoolParticipation.call({
        method: 'getDetails',
        params: {}
      });
      expect(launchPoolParticipationDetails.launchPool).to.equal(launchPool.address);
      expect(launchPoolParticipationDetails.user).to.equal(account3.address);
      expect(launchPoolParticipationDetails.depositAmount.toNumber()).to.gt(Number(locklift.utils.convertCrystal(1.5, 'nano')));
      expect(launchPoolParticipationDetails.depositAmount.toNumber()).to.eq(launchPoolDetails.totalRaised.toNumber());
    });

    it('Finish of fundraising', async function() {
      this.timeout(120000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      while (Math.round(Date.now() / 1000) <= launchPoolEndTime) {
        // console.log(`awaiting::`, launchPoolEndTime - Math.round(Date.now() / 1000));
        await new Promise((resolve)=>{setTimeout(resolve, 1000)});
      }

      await account2.runTarget({
        contract: launchPool,
        method: 'finishFundraising',
        params: {},
        keyPair,
        value: locklift.utils.convertCrystal(0.3, 'nano'),
      });

      const launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });
      expect(launchPoolDetails.state.toNumber()).to.equal(4);
    });

    it('Claim reward', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      const launchPoolWalletBalanceBefore = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet3BalanceBefore = await wallet3.call({ method: 'balance', params: {}});

      const claimAmounts = vestingPeriods.map(x => x.percent * supplyAmount * 1e-4);

      await account3.runTarget({
        contract: launchPoolParticipation,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(6, 'nano'),
      });

      const launchPoolWalletBalanceAfter1 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet3BalanceAfter1 = await wallet3.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter1).to.eq(Math.floor(claimAmounts[0]));
      expect(wallet3BalanceAfter1 - wallet3BalanceBefore).to.eq(Math.floor(claimAmounts[0]));

      while (Math.round(Date.now() / 1000) <= vestingPeriods[1].unfreezeTime) {
        await new Promise((resolve)=>{setTimeout(resolve, 1000)});
      }

      await account3.runTarget({
        contract: launchPoolParticipation,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(6, 'nano'),
      });

      const launchPoolWalletBalanceAfter2 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet3BalanceAfter2 = await wallet3.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter2).to.eq(Math.floor(claimAmounts[0]) + Math.floor(claimAmounts[1]));
      expect(wallet3BalanceAfter2 - wallet3BalanceBefore).to.eq(Math.floor(claimAmounts[0]) + Math.floor(claimAmounts[1]));

      while (Math.round(Date.now() / 1000) <= vestingPeriods[3].unfreezeTime) {
        await new Promise((resolve)=>{setTimeout(resolve, 1000)});
      }

      await account3.runTarget({
        contract: launchPoolParticipation,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(6, 'nano'),
      });

      const launchPoolWalletBalanceAfter3 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet3BalanceAfter3 = await wallet3.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter3).to.eq(
        Math.floor(claimAmounts[0]) +
        Math.floor(claimAmounts[1]) +
        Math.floor(claimAmounts[2] + claimAmounts[3])
      );
      expect(wallet3BalanceAfter3 - wallet3BalanceBefore).to.eq(
        Math.floor(claimAmounts[0]) +
        Math.floor(claimAmounts[1]) +
        Math.floor(claimAmounts[2] + claimAmounts[3])
      );

      // not a penny more
      await new Promise((resolve)=>{setTimeout(resolve, 1000)});
      await account3.runTarget({
        contract: launchPoolParticipation,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(7, 'nano'),
      });

      const launchPoolWalletBalanceAfter4 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet3BalanceAfter4 = await wallet3.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter4).to.eq(
        Math.floor(claimAmounts[0]) +
        Math.floor(claimAmounts[1]) +
        Math.floor(claimAmounts[2] + claimAmounts[3])
      );
      expect(wallet3BalanceAfter4 - wallet3BalanceBefore).to.eq(
        Math.floor(claimAmounts[0]) +
        Math.floor(claimAmounts[1]) +
        Math.floor(claimAmounts[2] + claimAmounts[3])
      );
    });

    it('Withdraw EVERs', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      const launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });

      const amountOfWithdraw = launchPoolDetails.totalRaised;

      const launchPoolBalanceBefore = (await locklift.ton.getBalance(launchPool.address)).toNumber();
      const wallet2BalanceBefore = (await locklift.ton.getBalance(wallet2.address)).toNumber();

      await account2.runTarget({
        contract: launchPool,
        method: 'withdrawEVERs',
        params: {
          amount: amountOfWithdraw,
          to: wallet2.address,
        },
        keyPair,
        value: locklift.utils.convertCrystal(0.1, 'nano'),
      });

      const launchPoolBalanceAfter = (await locklift.ton.getBalance(launchPool.address)).toNumber();
      const wallet2BalanceAfter = (await locklift.ton.getBalance(wallet2.address)).toNumber();
      expect(wallet2BalanceAfter - wallet2BalanceBefore).to.gt(Number(amountOfWithdraw));
      expect(launchPoolBalanceBefore - launchPoolBalanceAfter).to.equal(Number(amountOfWithdraw));
    });
  });
});
